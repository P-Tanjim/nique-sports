"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex my-2 items-center justify-center bg-surface px-4 py-12 text-text">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text">Welcome back</h1>
          <p className="mt-2 text-sm text-text-muted">
            Sign in to access your NIQUE SPORTS account
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-danger/10 p-3 text-center text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                name="email"
                maxLength={70}
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                maxLength={20}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-11 text-sm text-text outline-none transition-colors focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-text-muted">
          Don't have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-primary cursor-pointer underline-offset-4 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}