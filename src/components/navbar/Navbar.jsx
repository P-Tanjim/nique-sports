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
import ShopMenu from './clientComponent/ShopMenu'
import CartDrawer from '../sideCart/CartDrawer'
import { CartUIProvider } from '../sideCart/CartUIContext'

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
    <CartUIProvider>
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
              <ShopMenu shopItems={shopItems}></ShopMenu>

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
                className="min-[1050px]:mr-0 mr-2 w-auto h-auto"
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
                        alt="Bangladesh w-auto h-auto"
                      />
                      <Tabs.Indicator className="px-2 py-2" />
                    </Tabs.Tab>

                    <Tabs.Tab id="analytics">
                      <Image
                        src={usFlag}
                        width={18}
                        alt="United States w-auto h-auto"
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
      <CartDrawer></CartDrawer>
    </CartUIProvider>
  )
}

export default Navbar