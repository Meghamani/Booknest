
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import AuthFormShell from "@/components/auth/AuthFormShell";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          ...data,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        reset();
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        setServerError(result.error || "Invalid credentials");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <AuthFormShell title="Welcome back to your reading room." subtitle="Pick up where your next chapter begins.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 lg:space-y-3" autoComplete="on">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
              <Mail aria-hidden="true" size={23} strokeWidth={1.7} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#245B52]" />
              <input
                id="email"
                type="email"
                placeholder="Email ID"
                autoComplete="new-email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Please enter a valid email",
                  },
                })}
                className="h-[58px] w-full min-w-0 rounded-[20px] border border-[#C9D6CC] bg-[#FBF7ED] py-3 pl-[58px] pr-4 font-serif text-base text-[#173F3A] placeholder:text-[#698077] outline-none transition focus:border-[#245B52] focus:ring-4 focus:ring-[#245B52]/10 sm:h-[66px] sm:text-lg lg:h-[64px] lg:rounded-[24px] lg:py-4 lg:text-lg"
              />
            </div>
            {errors.email && <p className="mt-2 px-2 text-sm text-[#B64E3C]">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <LockKeyhole aria-hidden="true" size={23} strokeWidth={1.7} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#245B52]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                {...register("password", { required: "Password is required" })}
                className="h-[58px] w-full min-w-0 rounded-[20px] border border-[#C9D6CC] bg-[#FBF7ED] py-3 pl-[58px] pr-16 font-serif text-base text-[#173F3A] placeholder:text-[#698077] outline-none transition focus:border-[#245B52] focus:ring-4 focus:ring-[#245B52]/10 sm:h-[66px] sm:text-lg lg:h-[64px] lg:rounded-[24px] lg:py-4 lg:text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 inline-flex w-12 items-center justify-center rounded-full text-[#245B52] transition hover:bg-[#E8EEE4] active:scale-95"
              >
                {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
              </button>
            </div>
            {errors.password && <p className="mt-2 px-2 text-sm text-[#B64E3C]">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end px-1 pt-0.5">
            <Link href="/forgot-password" className="text-sm font-semibold text-[#245B52] transition hover:underline sm:text-base">
              Forgot password?
            </Link>
          </div>

          {serverError && <div role="alert" className="rounded-2xl bg-[#FCE9E2] px-4 py-3 text-sm text-[#B64E3C]">{serverError}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-[58px] w-full items-center justify-center gap-3 rounded-[22px] bg-[#245B52] font-serif text-lg font-bold text-white shadow-[0_8px_18px_rgba(36,91,82,0.14)] transition duration-200 hover:bg-[#1D4D46] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[66px] sm:text-xl lg:h-[64px] lg:rounded-[28px] lg:text-xl"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
            {!isSubmitting && <ArrowRight aria-hidden="true" size={22} strokeWidth={1.8} />}
          </button>
        </form>

        <p className="mt-3 text-center text-sm leading-relaxed text-[#383D38] sm:text-base lg:mt-4">
          Don’t have an account?{" "}
          <Link href="/register" className="font-bold text-[#173F3A] underline-offset-4 hover:underline">
            Create account
          </Link>
        </p>
    </AuthFormShell>
  );
}
