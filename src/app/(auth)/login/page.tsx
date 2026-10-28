"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ mode: "onBlur" });

  const [serverError, setServerError] = useState("");

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", ...data }),
      });

      const result = await res.json();
      if (res.ok) {
        reset(); // clear the form
        toast.success("Welcome back!");
        router.push("/dashboard"); // redirect after successful login
      } else {
        setServerError(result.error || "Invalid credentials");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 justify-center">
        <Image src="/book-hub-logo.png" alt="Book Hub Logo" width={55} height={55} />
        <h1 className="text-4xl font-bold text-textPrimary">
          Book<span className="text-accentHover">Hub</span>
        </h1>
      </div>

      <h2 className="mb-8 text-center text-3xl font-semibold text-textPrimary">Login</h2>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        {/* Hidden fields to prevent autofill */}
        <input type="text" name="fakeusername" autoComplete="username" style={{ display: 'none' }} />
        <input type="password" name="fakepassword" autoComplete="new-password" style={{ display: 'none' }} />

        {/* Email */}
        <div className="flex flex-col">
          <input
            type="email"
            placeholder="Email ID"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
            })}
            autoComplete="new-email"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
          />
          {errors.email && <p className="mt-1 text-sm text-coral">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <input
            type="password"
            placeholder="Password"
            {...register("password", { required: "Password is required" })}
            autoComplete="new-password"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
          />
          {errors.password && <p className="mt-1 text-sm text-coral">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-coral">{serverError}</p>}

        <button
          type="submit"
          className="w-full rounded-xl bg-sidebar py-3 font-semibold text-white transition hover:bg-accentHover"
        >
          LOGIN
        </button>
      </form>

      {/* Create Account Link */}
      <p className="mt-6 text-center text-textSecondary">
        Don’t have an account?{" "}
        <Link href="/register" className="font-semibold text-accentHover">
          Create one
        </Link>
      </p>
    </div>
  );
}
