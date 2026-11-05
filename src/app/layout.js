import dynamic from "next/dynamic";
import PerformanceGuard from "@/components/layout/PerformanceGuard";
import Navbar from "@/components/navbar/Navbar";
import "./globals.css";
import Footer from "@/components/footer/Footer";
import { Toaster } from "react-hot-toast";
import Analytics from "@/components/layout/Analytics";
import { getSettings } from "@/lib/sheets/settings";

const CustomScrollbar = dynamic(() => import("@/components/layout/CustomScrollbar"));

export const metadata = {
  title: "Nique Sports",
  description: "A e-commerce platform for sports goods",
};

export default async function RootLayout({ children }) {
  let settings = {};
  try {
    settings = await getSettings();
  } catch (err) {
    // Graceful fallback if sheets are temporarily unreachable
  }

  const metaPixelId = settings?.['Meta Pixel ID'] || process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
  const gaId = settings?.['Google Analytics ID'] || process.env.NEXT_PUBLIC_GA_ID || '';

  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Analytics metaPixelId={metaPixelId} gaId={gaId} />
        <PerformanceGuard />
        <Navbar></Navbar>
        {children}
        <Footer></Footer>
        <Toaster />
        <CustomScrollbar />
      </body>
    </html>
  );
}
