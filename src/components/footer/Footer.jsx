import { HugeiconsIcon } from "@hugeicons/react";
import {
  Facebook01Icon,
  NewTwitterIcon,
  InstagramIcon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";

const socialLink = [
  {
    icon: Facebook01Icon,
    href: "https://www.facebook.com/profile.php?id=61577246019262",
  },
  {
    icon: InstagramIcon,
    href: "https://www.instagram.com/jersey_apanique/",
  },
  {
    icon: TiktokIcon,
    href: "https://www.tiktok.com/@nique.sports",
  },
]

const footerLinks = [
  {
    title: "COLLECTIONS",
    links: [
      { name: "BD Premium", href: "/bd-premium" },
      { name: "Manufactured Retro", href: "/manufactured-retro" },
      { name: "Player Edition", href: "/player-edition" },
      { name: "Player Edition Replica", href: "/player-edition-replica" },
      { name: "Custom Jerseys", href: "#" },
    ],
  },
  {
    title: "CUSTOMER CARE",
    links: [
      { name: "Size Guide", href: "#" },
      { name: "Order Tracking", href: "#" },
      { name: "Returns & Exchanges", href: "#" },
      { name: "Shipping Information", href: "#" },
      { name: "FAQ", href: "#" },
    ],
  },
  {
    title: "ABOUT APANIQUE",
    links: [
      { name: "Our Story", href: "#" },
      { name: "Custom & Bulk Orders", href: "#" },
      { name: "Contact Us", href: "#" },
      { name: "Store Locator", href: "#" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { name: "Terms & Conditions", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Refund Policy", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-primary-dark pb-8 pt-12 text-[#F2F0E6] antialiased md:pt-16">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Top Section */}
        <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <span className="text-2xl font-semibold tracking-wide">APANIQUE</span>
          
          <div className="flex items-center gap-2">
            {socialLink.map((links, i) => (
              <a
                key={i}
                target="_blank"
                href={links.href}
                className="flex size-10 items-center justify-center rounded-full text-[#F2F0E6] transition-all hover:text-white active:scale-[0.96]"
              >
                <HugeiconsIcon icon={links.icon} className="size-5" />
              </a>
            ))}
          </div>
        </div>

        <hr className="mb-12 border-white/20" />

        {/* Links Section */}
        <div className="mb-12 flex flex-wrap justify-between gap-x-6 gap-y-10">
          {footerLinks.map((column, i) => (
            <div key={i} className="flex flex-col gap-5">
              <h3 className="text-balance text-base font-semibold uppercase tracking-wider text-[#F2F0E6]">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {column.links.map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.href}
                      className="inline-block text-base text-[#F2F0E6] transition-all hover:text-white hover:underline active:scale-[0.96]"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="border-white/20" />

        {/* Massive Brand Text */}
        <div className="flex w-full justify-center">
          <svg
            className="h-auto w-full"
            viewBox="0 0 1000 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="50%"
              y="50%"
              dominantBaseline="central"
              textAnchor="middle"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              fill="currentColor"
              className="font-serif text-[240px] text-[#F2F0E6]"
            >
              APANIQUE
            </text>
          </svg>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-start justify-between gap-6 text-[#F2F0E6] md:flex-row md:items-end">
          <div className="flex flex-wrap items-center gap-6">
            <a href="#" className="inline-block text-base transition-all hover:text-white active:scale-[0.96]">Terms</a>
            <a href="#" className="inline-block text-base transition-all hover:text-white active:scale-[0.96]">Privacy Policy</a>
            <a href="#" className="inline-block text-base transition-all hover:text-white active:scale-[0.96]">Shipping</a>
          </div>
          
          <div className="text-left md:text-right">
            <p className="text-base">© {new Date().getFullYear()} APANIQUE Sports.</p>
            <p className="text-base">All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}