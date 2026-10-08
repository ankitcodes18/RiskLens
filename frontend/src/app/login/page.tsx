"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Map, Clock, Bot } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotMsg, setForgotMsg] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Simulated authentication submission
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
              <span>Environmental Risk Platform</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              See Risk Before It Reaches You.
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              RiskLens brings environmental risk maps, future forecasts, and trusted information together to help people understand and prepare for changing environmental conditions.
            </p>

            <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                  <Map className="h-3.5 w-3.5 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    High-Resolution Risk Maps
                  </h4>
                  <p className="text-xs text-slate-500">
                    Multi-tier severity classification across geographic coordinates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Multi-Day Hazard Horizons
                  </h4>
                  <p className="text-xs text-slate-500">
                    Simulate how environmental stresses evolve over upcoming days.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                  <Bot className="h-3.5 w-3.5 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Grounded AI Assistant
                  </h4>
                  <p className="text-xs text-slate-500">
                    Answers anchored strictly in verified official documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          © 2026 RiskLens. Environmental Risk Intelligence.
        </div>
      </div>

      {/* Right side: Login Form */}
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

            {/* Mobile Brand */}
            <div className="lg:hidden flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                RiskLens
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to continue to RiskLens.
            </p>
          </div>

          {isSuccess ? (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h3 className="mt-3 text-base font-semibold text-emerald-900">
                Authentication Demo
              </h3>
              <p className="mt-1 text-xs text-emerald-700">
                Signed in as <span className="font-semibold">{email}</span>. Connecting to workspace...
              </p>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-800"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              {/* Email Field */}
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

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotMsg(!forgotMsg)}
                    className="text-xs text-teal-700 hover:text-teal-800 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
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

                {forgotMsg && (
                  <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                    Password recovery instructions will be transmitted to verified account emails.
                  </div>
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
                  <span>{isLoading ? "Signing in..." : "Login"}</span>
                </button>
              </div>

              {/* Or Continue with Google */}
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

              {/* Link to Signup */}
              <p className="mt-6 text-center text-xs text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-teal-700 hover:text-teal-800 transition underline underline-offset-2"
                >
                  Sign up
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
