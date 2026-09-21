"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  Upload,
  Eye,
  EyeOff,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadToImgBB } from "@/lib/api/requests/requests";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    image: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("image", file);

      const result = await uploadToImgBB(data);

      if (result.success) {
        setFormData((prev) => ({ ...prev, image: result.url }));
        toast.success("Photo uploaded successfully!");
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || "Image upload failed. Please try again.");
      toast.error(err.message || "Image upload failed.");
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (uploading) {
      setError("Please wait until the photo finishes uploading.");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        image: formData.image,
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to create account.");
        toast.error(signUpError.message || "Registration failed.");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully!");
      router.push("/account");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      toast.error("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-8 rounded-3xl border border-border bg-white p-8 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text">Create your account</h1>
        <p className="mt-2 text-sm text-text-muted">
          Join NIQUE SPORTS - fill in your details to get started
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl bg-danger/10 p-3.5 text-center text-xs font-medium text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* PROFILE PHOTO UPLOAD */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
            Profile Photo
          </label>
          <div className="mt-2 flex items-center gap-4">
            <AnimatePresence mode="wait">
              {avatarPreview ? (
                <motion.div
                  key="avatar-preview"
                  layoutId="avatar-box"
                  initial={{ borderRadius: 16 }}
                  animate={{ borderRadius: 9999 }}
                  exit={{ borderRadius: 16 }}
                  transition={{
                    layout: { type: "spring", stiffness: 260, damping: 25 },
                    borderRadius: { duration: 0.25 },
                  }}
                  className="relative h-20 w-20 shrink-0 bg-surface border border-border"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative h-full w-full rounded-full overflow-hidden"
                  >
                    <Image
                      width={80}
                      height={80}
                      src={avatarPreview}
                      alt="Profile Preview"
                      className="h-full w-full object-cover"
                    />
                  </motion.div>

                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center rounded-full justify-center bg-black/40 text-white"
                    >
                      <Loader2 size={18} className="animate-spin" />
                    </motion.div>
                  )}

                  {!uploading && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                      onClick={handleRemoveAvatar}
                      className="absolute cursor-pointer right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black transition-colors"
                    >
                      <X size={12} />
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <motion.label
                  key="avatar-input"
                  layoutId="avatar-box"
                  initial={{ borderRadius: 9999 }}
                  animate={{ borderRadius: 16 }}
                  exit={{ borderRadius: 9999 }}
                  transition={{
                    layout: { type: "spring", stiffness: 260, damping: 25 },
                    borderRadius: { duration: 0.25 },
                  }}
                  className={`flex h-20 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border bg-surface transition-colors hover:border-primary hover:bg-surface-blue overflow-hidden ${
                    uploading ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                      {uploading ? (
                        <Loader2 size={18} className="animate-spin text-primary" />
                      ) : (
                        <Upload size={18} className="text-primary" />
                      )}
                      <span>{uploading ? "Uploading photo..." : "Click to upload profile photo"}</span>
                    </div>
                    <span className="mt-1 text-[11px] text-text-muted/70">
                      JPG, PNG, WEBP
                    </span>
                  </motion.div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </motion.label>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {avatarPreview && !uploading && formData.image && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-1.5 text-xs text-success font-medium"
                >
                  <CheckCircle2 size={16} />
                  <span>Photo uploaded</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FULL NAME */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
            Full Name *
          </label>
          <div className="relative mt-1.5">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              name="name"
              required
              placeholder="Asadur Rahman Apon"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>

        {/* EMAIL & PHONE GRID */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* EMAIL */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Email Address *
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

          {/* PHONE */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Phone Number
            </label>
            <div className="relative mt-1.5">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="tel"
                name="phone"
                maxLength={11}
                placeholder="01xxxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* DETAILED ADDRESS */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Detailed Shipping / Billing Address
            </label>
            <span className="text-[11px] text-text-muted">Include apartment, street, city & postal code</span>
          </div>
          <div className="relative mt-1.5">
            <MapPin size={18} className="absolute left-3.5 top-3.5 text-text-muted" />
            <textarea
              name="address"
              rows={3}
              maxLength={150}
              placeholder="House #, Street Address, Apartment/Suite, City, Postal Code, Country..."
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary resize-y min-h-22.5"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
            Password *
          </label>
          <div className="relative mt-1.5">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              maxLength={20}
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-11 text-sm text-text outline-none transition-colors focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute cursor-pointer right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="mt-2 flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
        >
          {(loading || uploading) && <Loader2 size={18} className="animate-spin" />}
          Create Account
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-primary underline-offset-4 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}