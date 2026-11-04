"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not request a reset link");
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request a reset link");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-3 text-center text-3xl font-semibold text-textPrimary">Forgot password?</h1>
      <p className="mb-8 text-center text-sm leading-6 text-textSecondary">
        Enter the email address linked to your account and we will send a reset link.
      </p>
      <form className="space-y-5" onSubmit={submitRequest}>
        <div>
          <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-textPrimary">Email address</label>
          <input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
          />
        </div>
        {message && <p role="status" className="text-sm text-accentHover">{message}</p>}
        {error && <p role="alert" className="text-sm text-coral">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-sidebar py-3 font-semibold text-white transition hover:bg-accentHover disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-textSecondary">
        Remember your password? <Link href="/login" className="font-semibold text-accentHover">Back to login</Link>
      </p>
    </div>
  );
}