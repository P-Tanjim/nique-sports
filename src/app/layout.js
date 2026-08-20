import "./globals.css";
import { Dancing_Script } from 'next/font/google';
import SmoothScroll from "@/components/common/SmoothScroll";

export const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Nique Sports",
  description: "A e-commerce platform for sports goods",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
