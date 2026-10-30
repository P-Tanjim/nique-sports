import Link from "next/link";
import { LayoutDashboard, MapPin, Phone, User } from "lucide-react";
import AvatarUploader from "./clientComponent/AvatarUploader";
import LogoutButton from "./clientComponent/LogoutButton";

function formatMemberSince(date) {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return null;
  }
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-4 last:border-b-0">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-text-muted">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-text">
          {value || <span className="text-text-muted">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

export default function AccountOverview({ name, phone, address, image, memberSince, isStaff }) {
  const since = formatMemberSince(memberSince);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* AVATAR CARD */}
      <div className="flex flex-col items-center rounded-3xl border border-border bg-white p-8 text-center shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
        <AvatarUploader initialImage={image} name={name} />
        <h1 className="mt-5 text-lg font-semibold text-text">{name || "Your account"}</h1>
        {since && <p className="mt-1 text-xs text-text-muted">Member since {since}</p>}
        <div className="mt-6 w-full pt-6 border-t border-border/60">
          {isStaff && (
            <Link
              href="/dashboard"
              className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-200 ease-out hover:bg-primary-dark active:scale-95 cursor-pointer"
            >
              <LayoutDashboard size={16} strokeWidth={2} />
              <span>Dashboard</span>
            </Link>
          )}
          <LogoutButton className="w-full" />
        </div>
      </div>

      {/* DETAILS CARD */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Account details
        </h2>
        <div className="mt-2">
          <DetailRow icon={User} label="Full name" value={name} />
          <DetailRow icon={Phone} label="Phone number" value={phone} />
          <DetailRow icon={MapPin} label="Address" value={address} />
        </div>
      </div>
    </div>
  );
}