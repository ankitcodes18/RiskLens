"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Check } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      newErrors.terms = "You must agree to the Terms of Service and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 900);
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAF9]">
      {/* Left side: Branding & Product Statement (Hidden on small mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-slate-200 bg-white p-12">
        <div>
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded border border-teal-700/30 bg-teal-50 text-teal-700">
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="10" cy="10" r="7" />
                <circle cx="10" cy="10" r="3" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              RiskLens
            </span>
          </Link>

          <div className="mt-20 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              <span>Verified Account Creation</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Reliable Environmental Risk Intelligence
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Create your account to configure localized risk alerts, track multi-day climate models, and consult the official guidance assistant.
            </p>

            <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Check className="h-3 w-3" />
                </span>
                <span>Access to multi-hazard spatial maps</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Check className="h-3 w-3" />
                </span>
                <span>6-day predictive risk modeling</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Check className="h-3 w-3" />
                </span>
                <span>Grounded RAG safety advisories</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          © 2026 RiskLens. Built for transparent risk preparation.
        </div>
      </div>

      {/* Right side: Signup Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Top navigation back to Home */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to home</span>
            </Link>

            <div className="lg:hidden flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                RiskLens
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Create your RiskLens account
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Get access to RiskLens tools and personalized environmental risk information.
            </p>
          </div>

          {isSuccess ? (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h3 className="mt-3 text-base font-semibold text-emerald-900">
                Account Created Successfully
              </h3>
              <p className="mt-1 text-xs text-emerald-700">
                Welcome, <span className="font-semibold">{fullName}</span>! Your credentials have been registered in this preview session.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-800"
                >
                  Go to Platform
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md border border-emerald-300 bg-white px-4 py-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
                >
                  Log In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <div className="mt-1.5">
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    placeholder="Jane Doe"
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.fullName
                        ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200"
                        : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.fullName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Email
                </label>
                <div className="mt-1.5">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="name@example.com"
                    className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200"
                        : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="At least 8 characters"
                    className={`block w-full rounded-md border bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200"
                        : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Re-enter password"
                    className={`block w-full rounded-md border bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200"
                        : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div>
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 leading-normal">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
                {errors.terms && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.terms}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-900 py-2.5 px-4 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isLoading ? "Creating account..." : "Create Account"}</span>
                </button>
              </div>

              {/* Continue with Google */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#FAFAF9] px-2 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => alert("Google SSO is an interface demo in this preview build.")}
                  className="w-full flex items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2 px-4 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Link to Login */}
              <p className="mt-6 text-center text-xs text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-teal-700 hover:text-teal-800 transition underline underline-offset-2"
                >
                  Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
