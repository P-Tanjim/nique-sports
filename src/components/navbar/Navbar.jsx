import React from 'react'
import Image from 'next/image'
import logo from '../../../public/logo.png'
import bdFlag from '../../../public/bd-flag.webp'
import usFlag from '../../../public/en-flag.webp'
import { Tabs } from '@heroui/react'
import NavSearchbar from '@/components/navbar/clientComponent/NavSearchbar'
import Link from 'next/link'
import MobileSideNav from './clientComponent/MobileSideNav'
import { NavProvider } from './clientComponent/NavStateContext'
import MobileBottomNav from './clientComponent/MobileBottomNav'
import SideCartButton from './clientComponent/SideCartButton'

const shopItems = [
  {
    name: 'All',
    href: '/shop',
  },
  {
    name: 'BD Premium',
    href: '/bd-premium',
  },
  {
    name: 'Manufactured Retro',
    href: '/manufactured-retro',
  },
  {
    name: 'Player Edition Replica',
    href: '/player-edition-replica',
  },
  {
    name: 'Player Edition',
    href: '/player-edition',
  },
]

const Navbar = () => {
  return (
    <NavProvider>
      <nav className="px-4 md:px-20 py-3 w-full flex flex-col sticky top-0 z-50">
        <div className="desktop-navbar flex justify-between items-center">
          <MobileSideNav />


          {/* Desktop Navigation */}
          <ul className="hidden min-[1050px]:flex items-center md:gap-6 lg:gap-8 xl:gap-10 text-ink ">
            {/* Home */}
            <li>
              <Link
                href="/"
                className="hover:text-primary transition-colors duration-300"
              >
                Home
              </Link>
            </li>

            {/* Shop */}
            <li className="relative group">
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 py-5 hover:text-primary transition-colors duration-300"
              >
                Shop

                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="transition-transform duration-300 group-hover:rotate-180"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {/* Shop Dropdown */}
              <div
                className="
                  invisible opacity-0 translate-y-2
                  group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
                  absolute left-1/2 -translate-x-1/2 top-full
                  pt-3
                  transition-all duration-200
                "
              >
                <div
                  className="
                    w-64
                    rounded-2xl
                    border border-black/8
                    bg-white/95
                    backdrop-blur-xl
                    shadow-[0_18px_50px_rgba(0,0,0,0.10)]
                    p-2
                  "
                >
                  {shopItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="
                      flex items-center
                      px-4 py-3
                      rounded-xl
                      text-sm text-ink
                      hover:bg-black/4
                      hover:text-primary
                      transition-colors duration-200
                      "
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </li>

            {/* Account */}
            <li>
              <Link
                href="/account"
                className="hover:text-primary transition-colors duration-300"
              >
                Account
              </Link>
            </li>
          </ul>

          {/* Logo */}
          <Link href="/">
            <Image
              src={logo}
              width={50}
              height={50}
              alt="nique sports logo"
              className="min-[1050px]:mr-0 mr-2"
            />
          </Link>


          {/* Right Side */}
          <div className="flex items-center justify-center gap-5">
            <div className="hidden min-[1050px]:flex justify-center items-center">
              <NavSearchbar />
            </div>

            <SideCartButton />

            <Tabs className="w-fit h-auto hidden min-[1050px]:flex">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Options">
                  <Tabs.Tab id="overview">
                    <Image
                      src={bdFlag}
                      width={18}
                      height={18}
                      alt="Bangladesh"
                    />
                    <Tabs.Indicator className="px-2 py-2" />
                  </Tabs.Tab>

                  <Tabs.Tab id="analytics">
                    <Image
                      src={usFlag}
                      width={18}
                      height={18}
                      alt="United States"
                    />
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-5 w-full px-4 md:px-20 z-40 flex items-center justify-center gap-4 sm:gap-5 md:gap-15 lg:gap-20 min-[1050px]:hidden">
        <MobileBottomNav />
        <NavSearchbar />
      </div>
    </NavProvider>
  )
}

export default Navbar