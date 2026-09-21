import Link from "next/link";
import { UserRound } from "lucide-react";

export default function SignInPrompt() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-white p-10 text-center shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <UserRound size={24} strokeWidth={1.8} />
      </span>

      <h1 className="mt-5 text-xl font-semibold text-text">You're not signed in</h1>
      <p className="mt-2 text-sm text-text-muted">
        Sign in to view your name, contact details, and profile photo.
      </p>

      <Link
        href="/sign-in"
        className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Sign In
      </Link>
    </div>
  );
}