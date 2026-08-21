import Navbar from "@/components/navbar/Navbar";
import "./globals.css";
import { Dancing_Script } from 'next/font/google';
import Footer from "@/components/footer/Footer";

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
        <Navbar></Navbar>
        {children}
        <Footer></Footer>
      </body>
    </html>
  );
}
