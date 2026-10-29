
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountAccessScreen({
  title = "Account access unavailable",
  message = "Your account may have been deactivated, or your session may have expired.",
  redirectToLogin = true,
}) {
  const router = useRouter();

  useEffect(() => {
    if (!redirectToLogin) return;

    const timer = window.setTimeout(() => {
      router.replace("/?reason=account-unavailable");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [router, redirectToLogin]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section
        role="alert"
        aria-live="assertive"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path
              d="M12 3 21 20H3L12 3Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 9v4m0 3h.01" strokeLinecap="round" />
          </svg>
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
          TaskPilot Security
        </p>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          You’ll be redirected to the login page shortly.
        </div>

        <button
          type="button"
          onClick={() =>
            router.replace("/?reason=account-unavailable")
          }
          className="mt-6 w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-700/20"
        >
          Go to login
        </button>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          If you believe this is a mistake, please contact your administrator.
        </p>
      </section>
    </main>
  );
}
