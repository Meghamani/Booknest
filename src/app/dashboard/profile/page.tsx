"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Camera, CirclePlus, LoaderCircle, Plus, Search, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import ReadingPageHeader from "@/components/ui/ReadingPageHeader";
import { GENRE_GROUPS, GENRES } from "@/constants/genres";

type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  favoriteGenres: string[];
  readingGoal: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [readingGoal, setReadingGoal] = useState<number | "">(12);
  const [isGenrePickerOpen, setIsGenrePickerOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState("");
  const [isCustomGenreOpen, setIsCustomGenreOpen] = useState(false);
  const [customGenre, setCustomGenre] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load profile");
        if (cancelled) return;
        setProfile(result.user);
        setName(result.user.name);
        setAvatarUrl(result.user.avatarUrl || "");
        setFavoriteGenres(result.user.favoriteGenres || []);
        setReadingGoal(result.user.readingGoal || 12);
      } catch (error) {
        console.error(error);
        if (!cancelled) setErrorMessage("We could not load your profile. Please refresh to try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Choose a JPEG, PNG, WebP, or GIF image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photos must be smaller than 5 MB");
      return;
    }

    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const uploadCroppedPhoto = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const image = new Image();
      image.src = cropImage;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not read the selected image"));
      });
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare the cropped image");
      context.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not crop the selected image")), "image/jpeg", 0.92);
      });
      const formData = new FormData();
      formData.append("file", blob, "profile-photo.jpg");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Photo upload failed");
      setAvatarUrl(result.url);
      URL.revokeObjectURL(cropImage);
      setCropImage("");
      toast.success("Photo uploaded. Save your profile to keep it.");
    } catch (error) {
      console.error(error);
      toast.error("Could not upload your photo");
    } finally {
      setIsUploading(false);
    }
  };

  const cancelPhotoCrop = () => {
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage("");
    setCroppedAreaPixels(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setErrorMessage("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl, favoriteGenres, readingGoal }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save profile");

      setProfile(result.user);
      setName(result.user.name);
      setAvatarUrl(result.user.avatarUrl || "");
      setFavoriteGenres(result.user.favoriteGenres || []);
      setReadingGoal(result.user.readingGoal || 12);
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: result.user }));
      toast.success("Profile saved. Welcome home!");
      const isSignupOnboarding = new URLSearchParams(window.location.search).get("onboarding") === "1";
      router.replace(isSignupOnboarding ? "/dashboard?tour=1" : "/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Could not save your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setName(profile.name);
    setAvatarUrl(profile.avatarUrl || "");
    setFavoriteGenres(profile.favoriteGenres || []);
    setReadingGoal(profile.readingGoal || 12);
    setCustomGenre("");
    setIsCustomGenreOpen(false);
    setErrorMessage("");
  };

  const toggleFavoriteGenre = (genre: string) => {
    setFavoriteGenres((current) => current.includes(genre)
      ? current.filter((item) => item !== genre)
      : [...current, genre]);
  };

  const addCustomGenre = () => {
    const genre = customGenre.trim();
    if (!genre) return;
    if (genre.length > 60) {
      toast.error("Genre names must be 60 characters or fewer");
      return;
    }
    if (favoriteGenres.some((item) => item.toLowerCase() === genre.toLowerCase())) {
      toast.error("That genre is already selected");
      return;
    }
    setFavoriteGenres((current) => [...current, genre]);
    setCustomGenre("");
  };

  const normalizedGenreSearch = genreSearch.trim().toLowerCase();
  const filteredGenreGroups = GENRE_GROUPS.map((group) => ({
    ...group,
    genres: group.genres.filter((genre) => genre.toLowerCase().includes(normalizedGenreSearch)),
  })).filter((group) => group.genres.length > 0);
  const customFavoriteGenres = favoriteGenres.filter((genre) => !GENRES.includes(genre as typeof GENRES[number]));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <ReadingPageHeader
        eyebrow="The person behind the pages"
        title="Your reading room, your name."
        description="Keep your account details close and choose the portrait that greets you whenever you return."
      />

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-white text-sm text-textSecondary">
          <LoaderCircle className="mr-2 animate-spin" size={18} aria-hidden="true" /> Loading your profile…
        </div>
      ) : errorMessage && !profile ? (
        <div role="alert" className="rounded-xl border border-[#F1C4B8] bg-[#FFF6F2] px-5 py-4 text-sm text-[#89594D]">
          {errorMessage}
        </div>
      ) : profile ? (
        <form onSubmit={handleSave} className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_25px_rgba(49,63,55,0.04)]">
          <div className="grid gap-8 p-5 sm:p-8 md:grid-cols-[220px_minmax(0,1fr)]">
            <section className="flex flex-col items-center text-center md:items-start md:text-left" aria-label="Profile photo">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Choose a profile picture"
                className="group relative rounded-full bg-accent p-1.5 ring-1 ring-[#C9D9CE] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accentHover disabled:cursor-wait"
              >
                <Avatar name={name} imageUrl={avatarUrl || undefined} size={132} />
                <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-secondaryAccent text-textPrimary transition group-hover:bg-accentHover group-hover:text-white">
                  {isUploading ? <LoaderCircle size={17} className="animate-spin" aria-label="Uploading photo" /> : <Camera size={17} aria-hidden="true" />}
                </span>
              </button>
              <h2 className="mt-4 text-lg font-semibold text-textPrimary">Profile photo</h2>
              <p className="mt-1 max-w-xs text-sm leading-5 text-textSecondary">Click your photo to choose an image. Your initials appear if you leave this blank.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelected}
                className="sr-only"
                aria-label="Choose profile photo"
              />
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-textSecondary transition hover:bg-page"
                  >
                    <Trash2 size={15} aria-hidden="true" /> Remove
                  </button>
                )}
              </div>
            </section>

            <section className="min-w-0">
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="font-serif text-2xl text-textPrimary">Personal details</h2>
                <p className="mt-1 text-sm text-textSecondary">Your name appears beside your avatar in the navigation.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-textPrimary">Full name</label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    required
                    autoComplete="name"
                    className="w-full rounded-lg border border-border bg-page/50 px-3.5 py-2.5 text-textPrimary outline-none transition focus:border-accentHover focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-textPrimary">Email address</label>
                  <input
                    id="profile-email"
                    value={profile.email}
                    readOnly
                    autoComplete="email"
                    className="w-full cursor-not-allowed rounded-lg border border-border bg-[#F2F3EF] px-3.5 py-2.5 text-textSecondary"
                  />
                  <p className="mt-1.5 text-xs text-textSecondary">Email changes are not available here.</p>
                </div>
              </div>

              <section className="mt-8 border-t border-border pt-6" aria-labelledby="reading-goal-heading">
                <div className="mb-4">
                  <h3 id="reading-goal-heading" className="font-serif text-xl text-textPrimary">Reading goals</h3>
                  <p className="mt-1 text-sm text-textSecondary">Set your yearly reading goal. You can change it whenever you like.</p>
                </div>
                <div className="max-w-xs">
                  <label htmlFor="yearly-reading-goal" className="mb-1.5 block text-sm font-medium text-textPrimary">Books to read this year</label>
                  <div className="relative">
                    <input
                      id="yearly-reading-goal"
                      type="number"
                      min={1}
                      max={1000}
                      step={1}
                      required
                      value={readingGoal}
                      onChange={(event) => setReadingGoal(event.target.value === "" ? "" : event.target.valueAsNumber)}
                      className="w-full rounded-lg border border-border bg-page/50 px-3.5 py-2.5 pr-16 text-textPrimary outline-none transition focus:border-accentHover focus:ring-2 focus:ring-accent"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-textSecondary">books</span>
                  </div>
                  <p className="mt-1.5 text-xs text-textSecondary">Choose a number from 1 to 1000. New accounts start at 12.</p>
                </div>
              </section>

              <section className="mt-8 border-t border-border pt-6" aria-labelledby="favorite-genres-heading">
                <div className="mb-4">
                  <h3 id="favorite-genres-heading" className="font-serif text-xl text-textPrimary">Favorite genres</h3>
                  <p className="mt-1 text-sm text-textSecondary">Pick the kinds of stories you love. We’ll keep your choices on your profile.</p>
                </div>

                <div className="rounded-xl border border-border bg-page/40 p-4">
                  {favoriteGenres.length ? (
                    <div className="flex flex-wrap gap-2">
                      {favoriteGenres.map((genre) => (
                        <span key={genre} className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#C9D9CE] bg-white px-3 py-1.5 text-sm text-textPrimary">
                          <span className="truncate">{genre}</span>
                          <button
                            type="button"
                            onClick={() => toggleFavoriteGenre(genre)}
                            aria-label={`Remove ${genre}`}
                            className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-textSecondary transition hover:bg-accent hover:text-textPrimary"
                          >
                            <X size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 text-sm text-textSecondary">No favorite genres selected yet.</p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-textSecondary">{favoriteGenres.length} selected</span>
                    <button
                      type="button"
                      onClick={() => setIsGenrePickerOpen(true)}
                      aria-label="Add favorite genres"
                      title="Add favorite genres"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sidebar text-white transition hover:bg-accentHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentHover"
                    >
                      <CirclePlus size={19} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {isGenrePickerOpen && (
                  <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 sm:p-6"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) setIsGenrePickerOpen(false);
                    }}
                  >
                    <section
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="genre-picker-title"
                      className="flex max-h-[min(88vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-textPrimary shadow-2xl"
                    >
                      <header className="border-b border-border p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accentHover">Personalize your shelf</p>
                            <h3 id="genre-picker-title" className="mt-1 font-serif text-2xl">Choose favorite genres</h3>
                            <p className="mt-1 text-sm text-textSecondary">Select as many as you like. Your choices appear on your profile.</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsCustomGenreOpen((open) => !open)}
                              aria-label="Add a custom genre"
                              title="Add a custom genre"
                              aria-expanded={isCustomGenreOpen}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-accentHover transition hover:bg-accent"
                            >
                              <Plus size={16} aria-hidden="true" />
                              <span>Custom genre</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsGenrePickerOpen(false)}
                              aria-label="Close genre picker"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-textSecondary transition hover:bg-page hover:text-textPrimary"
                            >
                              <X size={19} aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <label className="relative mt-4 block">
                          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" aria-hidden="true" />
                          <input
                            value={genreSearch}
                            onChange={(event) => setGenreSearch(event.target.value)}
                            placeholder="Search genres"
                            aria-label="Search genres"
                            className="w-full rounded-lg border border-border bg-page/50 py-2.5 pl-10 pr-3 text-sm text-textPrimary outline-none focus:border-accentHover focus:ring-2 focus:ring-accent"
                          />
                        </label>

                        {isCustomGenreOpen && (
                          <div className="mt-3 rounded-lg border border-border bg-page/40 p-3">
                            <label htmlFor="custom-favorite-genre" className="mb-1.5 block text-sm font-semibold text-textPrimary">Custom genre</label>
                            <p className="mb-2 text-xs text-textSecondary">Type a genre that is not in the list, then add it to your favorites.</p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                id="custom-favorite-genre"
                                value={customGenre}
                                onChange={(event) => setCustomGenre(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    addCustomGenre();
                                  }
                                }}
                                maxLength={60}
                                placeholder="e.g. Space opera"
                                aria-label="Custom favorite genre"
                                className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-textPrimary outline-none focus:border-accentHover focus:ring-2 focus:ring-accent"
                              />
                              <button
                                type="button"
                                onClick={addCustomGenre}
                                disabled={!customGenre.trim()}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover disabled:opacity-50"
                              >
                                <Plus size={16} aria-hidden="true" /> Add genre
                              </button>
                            </div>
                          </div>
                        )}
                      </header>

                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                        {filteredGenreGroups.length ? (
                          <div className="space-y-5">
                            {filteredGenreGroups.map((group) => (
                              <fieldset key={group.label}>
                                <legend className="mb-2 text-sm font-semibold text-textPrimary">{group.label}</legend>
                                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                                  {group.genres.map((genre) => (
                                    <label key={genre} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-textPrimary transition hover:bg-accent">
                                      <input
                                        type="checkbox"
                                        checked={favoriteGenres.includes(genre)}
                                        onChange={() => toggleFavoriteGenre(genre)}
                                        className="h-4 w-4 accent-[#548C83]"
                                      />
                                      <span>{genre}</span>
                                    </label>
                                  ))}
                                </div>
                              </fieldset>
                            ))}
                          </div>
                        ) : (
                          <p className="py-10 text-center text-sm text-textSecondary">No genres match “{genreSearch}”. Add it as a custom genre with the plus button.</p>
                        )}

                        {customFavoriteGenres.length > 0 && (
                          <fieldset className="mt-6 border-t border-border pt-4">
                            <legend className="mb-2 text-sm font-semibold text-textPrimary">Your custom genres</legend>
                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                              {customFavoriteGenres
                                .filter((genre) => genre.toLowerCase().includes(normalizedGenreSearch))
                                .map((genre) => (
                                  <label key={genre} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-textPrimary transition hover:bg-accent">
                                    <input
                                      type="checkbox"
                                      checked={favoriteGenres.includes(genre)}
                                      onChange={() => toggleFavoriteGenre(genre)}
                                      className="h-4 w-4 accent-[#548C83]"
                                    />
                                    <span>{genre}</span>
                                  </label>
                                ))}
                            </div>
                          </fieldset>
                        )}
                      </div>

                      <footer className="flex items-center justify-between gap-3 border-t border-border bg-page/40 px-4 py-3 sm:px-6">
                        <span className="text-sm text-textSecondary">{favoriteGenres.length} selected</span>
                        <button
                          type="button"
                          onClick={() => setIsGenrePickerOpen(false)}
                          className="rounded-lg bg-sidebar px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentHover"
                        >
                          Done
                        </button>
                      </footer>
                    </section>
                  </div>
                )}
              </section>

              {errorMessage && <p role="alert" className="mt-4 text-sm text-coral">{errorMessage}</p>}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving || isUploading}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-textPrimary transition hover:bg-page disabled:opacity-50"
                >
                  Discard changes
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading || !name.trim() || typeof readingGoal !== "number" || !Number.isInteger(readingGoal) || readingGoal < 1 || readingGoal > 1000}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-sidebar px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? "Saving" : "Save profile"}
                </button>
              </div>
            </section>
          </div>
        </form>
      ) : null}

      {cropImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-crop-title"
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card text-textPrimary shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 id="photo-crop-title" className="font-serif text-xl">Adjust your profile photo</h2>
                <p className="mt-1 text-sm text-textSecondary">Drag to reposition and zoom to frame your picture.</p>
              </div>
              <button
                type="button"
                onClick={cancelPhotoCrop}
                disabled={isUploading}
                aria-label="Cancel photo crop"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-textSecondary transition hover:bg-page hover:text-textPrimary disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="relative mx-5 mt-5 h-72 overflow-hidden rounded-lg bg-[#18201D] sm:h-80">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>
            <div className="px-5 pt-4">
              <label htmlFor="photo-zoom" className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>Zoom</span><span className="tabular-nums text-textSecondary">{zoom.toFixed(1)}×</span>
              </label>
              <input
                id="photo-zoom"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#548C83]"
              />
            </div>
            <footer className="mt-5 flex justify-end gap-2 border-t border-border bg-page/40 p-4">
              <button
                type="button"
                onClick={cancelPhotoCrop}
                disabled={isUploading}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-textPrimary transition hover:bg-page disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void uploadCroppedPhoto()}
                disabled={isUploading || !croppedAreaPixels}
                className="inline-flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accentHover disabled:cursor-wait disabled:opacity-60"
              >
                {isUploading && <LoaderCircle size={16} className="animate-spin" />}
                {isUploading ? "Uploading" : "Use photo"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
