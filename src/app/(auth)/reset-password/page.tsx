"use client";

import { useState } from "react";
import Link from "next/link";

const passwordRules = [
  { label: "At least 8 characters", test: /.{8,}/ },
  { label: "An uppercase letter", test: /[A-Z]/ },
  { label: "A lowercase letter", test: /[a-z]/ },
  { label: "A number", test: /\d/ },
  { label: "A special character (@$!%*?&)", test: /[@$!%*?&]/ },
];

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [tokenPromise] = useState(searchParams);

  const submitReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!passwordRules.every((rule) => rule.test.test(password))) {
      setError("Password must meet all the requirements below");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const { token } = await tokenPromise;
      if (typeof token !== "string" || !token) throw new Error("This reset link is invalid or expired");

      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not reset password");

      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {complete ? (
        <div className="space-y-6 text-center">
          <h1 role="status" className="text-2xl font-semibold text-textPrimary">Password updated</h1>
          <Link href="/login" className="inline-flex rounded-xl bg-sidebar px-6 py-3 font-semibold text-white transition hover:bg-accentHover">Sign in</Link>
        </div>
      ) : (
        <>
          <h1 className="mb-3 text-center text-3xl font-semibold text-textPrimary">Choose a new password</h1>
          <p className="mb-8 text-center text-sm leading-6 text-textSecondary">Use a password you have not used for Booknest before.</p>
          <form className="space-y-5" onSubmit={submitReset}>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-textPrimary">New password</label>
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
              />
            </div>
            <ul className="space-y-1 text-xs text-textSecondary">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={password && rule.test.test(password) ? "text-accentHover" : ""}>{rule.label}</li>
              ))}
            </ul>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-textPrimary">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
              />
            </div>
            {error && <p role="alert" className="text-sm text-coral">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-sidebar py-3 font-semibold text-white transition hover:bg-accentHover disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Updating password…" : "Update password"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-textSecondary">
            <Link href="/login" className="font-semibold text-accentHover">Back to login</Link>
          </p>
        </>
      )}
    </div>
  );
}