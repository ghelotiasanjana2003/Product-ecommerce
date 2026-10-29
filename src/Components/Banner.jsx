"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Banner({ accountUnavailable = false }) {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const isLogin = activeTab === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage("");
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      const payload = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      if (!isLogin) {
        payload.name = formData.get("fullName");
      }

      const endpoint = isLogin
        ? "/api/auth/login"
        : "/api/auth/signup";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormMessage(data.message || "Something went wrong.");
        return;
      }

      if (isLogin) {
        router.replace("/dashboard");
        return;
      }

      setFormMessage(data.message || "Account created successfully!");
      setActiveTab("login");
    } catch {
      setFormMessage("Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10";

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl  text-xl font-bold text-white shadow-sm">
              <img src="/assets/task-logo.png" alt="TaskPilot" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className="block text-xl font-bold tracking-tight">
                TaskPilot
              </span>
              <span className="block text-xs text-slate-500">
                Projects. People. Progress.
              </span>
            </span>
          </a>

          <a
            href="#auth-form"
            className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20"
          >
            Get started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100vh-77px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.8fr] lg:gap-20 lg:py-16">
          {/* Hero copy */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-teal-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Your team's workspace
            </span>

            <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Great work happens
              <span className="mt-1 block text-teal-700">
                when teams move together.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Bring your projects, tasks, and teammates into one organized
              workspace. Track progress, stay aligned, and turn plans into
              results.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#auth-form"
                className="rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-teal-800"
              >
                Create your workspace
              </a>
              <a
                href="#features"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50"
              >
                Explore features
              </a>
            </div>

            {/* Feature highlights */}
            <div
              id="features"
              className="mt-12 grid gap-5 border-t border-slate-200 pt-8 sm:grid-cols-3"
            >
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <rect x="3" y="4" width="18" height="16" rx="3" />
                    <path d="M8 9h8M8 13h5" />
                  </svg>
                </span>
                <h3 className="mt-3 text-sm font-semibold">Project planning</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Keep every project organized.
                </p>
              </div>

              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="m5 12 4 4L19 6" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
                <h3 className="mt-3 text-sm font-semibold">Task tracking</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Know what needs attention.
                </p>
              </div>

              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <circle cx="9" cy="8" r="3" />
                    <circle cx="17" cy="9" r="2.5" />
                    <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5M15 15c3 0 5 1.5 5 4" />
                  </svg>
                </span>
                <h3 className="mt-3 text-sm font-semibold">Team collaboration</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Keep everyone moving together.
                </p>
              </div>
            </div>
          </div>

          {/* Authentication card */}
          <div
            id="auth-form"
            className="mx-auto w-full max-w-md scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-8"
          >
            <div className="mb-7">
              {accountUnavailable && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
                >
                  Your account has been deactivated or is unavailable.
                  Please contact your administrator if you believe this is a mistake.
                </div>
              )}
              <p className="text-sm font-semibold text-teal-700">
                WELCOME TO TASKPILOT
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isLogin
                  ? "Sign in to pick up where your team left off."
                  : "Set up your account and start organizing your work."}
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setFormMessage("");
                }}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isLogin
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setFormMessage("");
                }}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${!isLogin
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                Create account
              </button>
            </div>

            <form key={activeTab} onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={100}
                    required
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 pr-3 transition focus-within:border-teal-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-600/10">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="Enter your password"
                    minLength={isLogin ? undefined : 8}
                    maxLength={72}
                    required
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="shrink-0 text-xs font-semibold text-slate-500 hover:text-teal-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      name="remember"
                      className="h-4 w-4 accent-teal-700"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert("Connect your password reset flow here.")
                    }
                    className="font-medium text-teal-700 hover:text-teal-900"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {!isLogin && (
                <label className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 accent-teal-700"
                  />
                  <span>
                    I agree to the Terms of Service and Privacy Policy.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-teal-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in to TaskPilot"
                    : "Create your account"}
              </button>
            </form>

            {formMessage && (
              <p
                role="status"
                aria-live="polite"
                className="mt-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900"
              >
                {formMessage}
              </p>
            )}

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to use TaskPilot responsibly.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}