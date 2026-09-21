import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import AccountOverview from "./AccountOverview";
import SignInPrompt from "./SignInPrompt";

// Private, per-user data — never let Next cache or share this response.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account | NIQUE SPORTS",
  robots: { index: false, follow: false }, // never let this get indexed
};

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-surface text-text">
        <div className="mx-auto flex min-h-[70vh] max-w-350 items-center justify-center px-4 sm:px-6 lg:px-8">
          <SignInPrompt />
        </div>
      </main>
    );
  }

  // Pick only what the page needs — never spread the whole session/user
  // object down into a Client Component prop.
  const { name, phone, address, image, createdAt } = session.user;

  return (
    <main className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-350 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <AccountOverview
          name={name}
          phone={phone}
          address={address}
          image={image}
          memberSince={createdAt}
        />
      </div>
    </main>
  );
}