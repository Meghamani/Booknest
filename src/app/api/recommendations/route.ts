import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getAuthenticatedUserId } from "@/lib/auth";

type Recommendation = {
    title: string;
    author: string;
    genre: string;
    reason: string;
    coverUrl: string | null;
};

async function findBookCover(title: string, author: string): Promise<string | null> {
    try {
        const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10`, {
            signal: AbortSignal.timeout(6000),
        });
        if (response.ok) {
            const result = await response.json();
            const volumes = Array.isArray(result.items) ? result.items : [];
            for (const volume of volumes) {
                const imageLinks = volume?.volumeInfo?.imageLinks;
                const cover = imageLinks?.thumbnail ?? imageLinks?.smallThumbnail;
                if (typeof cover === "string") return cover.replace(/^http:/, "https:");
            }
        }
    } catch {
        // Try the fallback catalog when Google Books is unavailable.
    }

    try {
        const query = new URLSearchParams({ title, author, limit: "10", fields: "cover_i,title,author_name" });
        const response = await fetch(`https://openlibrary.org/search.json?${query}`, {
            signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) return null;

        const result = await response.json();
        const documents: Array<{ cover_i?: unknown; title?: unknown }> = Array.isArray(result.docs)
            ? result.docs
            : [];
        const normalizedTitle = title.trim().toLocaleLowerCase();
        const matchingBook = documents.find((document) =>
            typeof document.cover_i === "number" &&
            typeof document.title === "string" &&
            document.title.trim().toLocaleLowerCase() === normalizedTitle
        );
        const bookWithCover = matchingBook ?? documents.find((document) => typeof document.cover_i === "number");
        return typeof bookWithCover?.cover_i === "number"
            ? `https://covers.openlibrary.org/b/id/${bookWithCover.cover_i}-M.jpg?default=false`
            : null;
    } catch {
        return null;
    }
}

function parseFavoriteGenres(value: string): string[] {
    try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed)
            ? parsed.filter((genre): genre is string => typeof genre === "string")
            : [];
    } catch {
        return [];
    }
}

export async function POST() {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "AI recommendations are not configured yet. Add GEMINI_API_KEY to the server environment." },
            { status: 503 }
        );
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { favoriteGenres: true },
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const favoriteGenres = parseFavoriteGenres(user.favoriteGenres);
        if (favoriteGenres.length === 0) {
            return NextResponse.json(
                { error: "Choose a few favorite genres in your profile first." },
                { status: 400 }
            );
        }

        const existingBooks = await prisma.book.findMany({
            where: { userId },
            select: { title: true },
        });
        const existingTitles = new Set(existingBooks.map((book: { title: string }) => book.title.trim().toLocaleLowerCase()));

        const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").replace(/^\//, "");
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{
                            text: "You are a thoughtful bookstore curator. Recommend real, well-known books that fit the reader's selected genres. Return only valid JSON with a recommendations array. Each item must have title, author, genre, and a concise personalized reason. Do not invent books or authors.",
                        }],
                    },
                    contents: [{
                        role: "user",
                        parts: [{
                            text: `Suggest 6 different books for a reader whose favorite genres are: ${favoriteGenres.join(", ")}. Do not recommend any of these books the reader already has: ${Array.from(existingTitles).join("; ") || "None"}. Make every recommendation distinct and return enough valid suggestions to leave at least 3 after excluding existing or duplicate titles. For each suggestion, explain in one sentence why it fits these preferences. Return JSON shaped like {"recommendations":[{"title":"...","author":"...","genre":"...","reason":"..."}]}.`,
                        }],
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                recommendations: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            title: { type: "STRING" },
                                            author: { type: "STRING" },
                                            genre: { type: "STRING" },
                                            reason: { type: "STRING" },
                                        },
                                        required: ["title", "author", "genre", "reason"],
                                    },
                                },
                            },
                            required: ["recommendations"],
                        },
                    },
                }),
                signal: AbortSignal.timeout(25000),
            }
        );

        if (!response.ok) {
            const providerBody = await response.text();
            let providerMessage = "unknown provider error";
            try {
                const parsedProviderBody: unknown = JSON.parse(providerBody);
                if (
                    parsedProviderBody &&
                    typeof parsedProviderBody === "object" &&
                    "error" in parsedProviderBody &&
                    parsedProviderBody.error &&
                    typeof parsedProviderBody.error === "object" &&
                    "message" in parsedProviderBody.error &&
                    typeof parsedProviderBody.error.message === "string"
                ) {
                    providerMessage = parsedProviderBody.error.message;
                }
            } catch {
                providerMessage = providerBody.slice(0, 160) || providerMessage;
            }
            console.error("[recommendations] AI provider request failed", {
                status: response.status,
                message: providerMessage,
            });
            if (response.status === 429) {
                return NextResponse.json(
                    { error: "AI recommendations are unavailable because the Gemini account has reached its quota." },
                    { status: 429 }
                );
            }
            if (response.status === 404) {
                return NextResponse.json(
                    { error: `The configured Gemini model "${model}" is unavailable. Set GEMINI_MODEL to a model supported by your API key.` },
                    { status: 503 }
                );
            }
            if ([400, 401, 403].includes(response.status)) {
                return NextResponse.json(
                    { error: `Gemini rejected the recommendation request (HTTP ${response.status}): ${providerMessage.slice(0, 240)}` },
                    { status: 503 }
                );
            }
            return NextResponse.json(
                { error: `The Gemini recommendation provider returned HTTP ${response.status}: ${providerMessage.slice(0, 240)}` },
                { status: 502 }
            );
        }

        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts
            ?.map((part: { text?: unknown }) => typeof part.text === "string" ? part.text : "")
            .join("")
            .trim();
        if (typeof content !== "string") {
            return NextResponse.json({ error: "The recommendation service returned an invalid response." }, { status: 502 });
        }

        const parsed: unknown = JSON.parse(content);
        if (!parsed || typeof parsed !== "object" || !("recommendations" in parsed) || !Array.isArray(parsed.recommendations)) {
            return NextResponse.json({ error: "The recommendation service returned an invalid response." }, { status: 502 });
        }

        const seenTitles = new Set<string>();
        const recommendations = parsed.recommendations
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
            .map((item) => ({
                title: typeof item.title === "string" ? item.title.trim() : "",
                author: typeof item.author === "string" ? item.author.trim() : "",
                genre: typeof item.genre === "string" ? item.genre.trim() : "",
                reason: typeof item.reason === "string" ? item.reason.trim() : "",
            }))
            .filter((item) => {
                const normalizedTitle = item.title.toLocaleLowerCase();
                if (!item.title || !item.author || !item.genre || !item.reason || existingTitles.has(normalizedTitle) || seenTitles.has(normalizedTitle)) {
                    return false;
                }
                seenTitles.add(normalizedTitle);
                return true;
            })
            .slice(0, 3);

        const recommendationsWithCovers: Recommendation[] = await Promise.all(
            recommendations.map(async (recommendation) => ({
                ...recommendation,
                coverUrl: await findBookCover(recommendation.title, recommendation.author),
            }))
        );

        return NextResponse.json({ recommendations: recommendationsWithCovers, basedOn: favoriteGenres });
    } catch (error) {
        console.error("[recommendations] Failed to generate recommendations", error);
        return NextResponse.json({ error: "Could not generate recommendations right now." }, { status: 500 });
    }
}
