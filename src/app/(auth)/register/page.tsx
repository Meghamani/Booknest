"use client";

import { useState } from "react";
import { useForm, SubmitErrorHandler, SubmitHandler, useWatch } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const passwordRules = [
  { label: "At least 8 characters", test: /.{8,}/ },
  { label: "1 uppercase letter", test: /[A-Z]/ },
  { label: "1 lowercase letter", test: /[a-z]/ },
  { label: "1 number", test: /\d/ },
  { label: "1 special character (!@#$%^&*)", test: /[@$!%*?&]/ },
];

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter(); // initialize router
  const {
    register,
    handleSubmit,
    control,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onBlur" });

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordIssues, setPasswordIssues] = useState<string[] | null>(null);
  const passwordValue = useWatch({ control, name: "password" });
  const passwordRegistration = register("password", {
    required: "Password is required",
    validate: (value) => passwordRules.every((rule) => rule.test.test(value)) || "Password does not meet all requirements",
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(" "),
          email: data.email,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        reset();
        toast.success("Account created. Welcome to Book Hub!");
        router.push("/dashboard?welcome=1");
      } else {
        setServerError(result.error || "Something went wrong");
      }
    } catch {
      setServerError("Something went wrong");
    }
  };

  const onInvalid: SubmitErrorHandler<FormValues> = (formErrors) => {
    if (!formErrors.password) return;
    const value = getValues("password") || "";
    setPasswordIssues(value ? passwordRules.filter((rule) => !rule.test.test(value)).map((rule) => rule.label) : []);
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="flex items-center gap-2 mb-10 justify-center">
        <Image src="/book-hub-logo.png" alt="Book Hub Logo" width={55} height={55} />
        <h1 className="text-4xl font-bold text-textPrimary">
          Book<span className="text-accentHover">Hub</span>
        </h1>
      </div>

      <h2 className="mb-8 text-center text-3xl font-semibold text-textPrimary">Create Your Account</h2>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)} autoComplete="off">
        {/* Hidden fields to prevent autofill */}
        <input type="text" name="fakeusername" autoComplete="username" style={{ display: 'none' }} />
        <input type="password" name="fakepassword" autoComplete="new-password" style={{ display: 'none' }} />

        {/* Name */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <label htmlFor="first-name" className="mb-1 font-medium text-textPrimary">First name</label>
            <input
              id="first-name"
              type="text"
              placeholder="Your first name"
              autoComplete="given-name"
              {...register("firstName", { required: "First name is required", maxLength: 80 })}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
            />
            {errors.firstName && <p className="mt-1 text-sm text-coral">{errors.firstName.message}</p>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="last-name" className="mb-1 font-medium text-textPrimary">Last name <span className="text-xs font-normal text-textSecondary">(optional)</span></label>
            <input
              id="last-name"
              type="text"
              placeholder="Your last name"
              autoComplete="family-name"
              {...register("lastName", { maxLength: 80 })}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col">
          <label htmlFor="signup-email" className="mb-1 font-medium text-textPrimary">Email address</label>
          <input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
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
          <label htmlFor="signup-password" className="mb-1 font-medium text-textPrimary">Password</label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
              {...passwordRegistration}
              onChange={(event) => {
                setPasswordIssues(null);
                void passwordRegistration.onChange(event);
              }}
              onBlur={(event) => {
                const value = event.target.value;
                setPasswordIssues(value ? passwordRules.filter((rule) => !rule.test.test(value)).map((rule) => rule.label) : []);
                void passwordRegistration.onBlur(event);
              }}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-12 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-textSecondary hover:text-textPrimary"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {passwordIssues && passwordIssues.length > 0 && (
            <ul className="mt-2 space-y-1" aria-label="Password requirements not met">
              {passwordIssues.map((issue) => (
                <li key={issue} className="text-sm text-coral">{issue}</li>
              ))}
            </ul>
          )}
          {errors.password && !passwordValue && <p className="mt-1 text-sm text-coral">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col">
          <label htmlFor="confirm-password" className="mb-1 font-medium text-textPrimary">Re-enter password</label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Enter your password again"
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: "Please re-enter your password",
                validate: (value) => value === getValues("password") || "Passwords do not match",
              })}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-12 text-textPrimary outline-none focus:ring-2 focus:ring-accentHover"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((visible) => !visible)}
              aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-textSecondary hover:text-textPrimary"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-coral">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && <p className="text-sm text-coral">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-sidebar py-3 font-semibold text-white transition hover:bg-accentHover disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-textSecondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accentHover">
          Login
        </Link>
      </p>
    </div>
  );
}
