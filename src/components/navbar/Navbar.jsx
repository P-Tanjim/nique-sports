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
import AreaSwitch from './clientComponent/AreaSwitch'
import NavSurface from './clientComponent/NavSurface'
import AdminDesktopLinks from './clientComponent/AdminDesktopLinks'
import AdminHeaderActions from './clientComponent/AdminHeaderActions'
import AdminBottomNav from './clientComponent/AdminBottomNav'

const shopItems = [
  {
    name: 'All',
    href: '/shop',
  },
  {
    name: 'BD Premium',
    href: '/shop?category=bd-premium',
  },
  {
    name: 'Manufactured Retro',
    href: '/shop?category=manufactured-retro',
  },
  {
    name: 'Player Edition Replica',
    href: '/shop?category=player-edition-replica',
  },
  {
    name: 'Player Edition',
    href: '/shop?category=player-edition',
  },
]

// Every <AreaSwitch> below shows the storefront version everywhere except on
// /dashboard routes, where it shows the admin version. The storefront markup
// is unchanged.
const Navbar = () => {
  return (
    <CartUIProvider>
      <NavProvider>
        <NavSurface>
          <div className="desktop-navbar flex justify-between items-center">
            <MobileSideNav />


            {/* Desktop Navigation */}
            <ul className="relative hidden min-[1050px]:flex items-center md:gap-6 lg:gap-8 py-2 xl:gap-10 text-ink ">
              <AreaSwitch
                store={
                  <>
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
                  </>
                }
                admin={<AdminDesktopLinks />}
              />
            </ul>

            {/* Logo */}
            <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Image
                src={logo}
                width={50}
                height={50}
                alt="nique sports logo"
                className="min-[1050px]:mr-0 mr-2 w-auto h-auto"
                loading='eager'
              />
            </Link>


            {/* Right Side */}
            <div className="flex items-center justify-center gap-5">
              <AreaSwitch
                store={
                  <>
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
                  </>
                }
                admin={<AdminHeaderActions />}
              />
            </div>
          </div>
        </NavSurface>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-5 w-full px-4 md:px-20 z-50 flex items-center justify-center gap-4 sm:gap-5 md:gap-15 lg:gap-20 min-[1050px]:hidden">
          <AreaSwitch
            store={
              <>
                <MobileBottomNav />
                <NavSearchbar />
              </>
            }
            admin={<AdminBottomNav />}
          />
        </div>
      </NavProvider>

      {/* The cart drawer isn't needed in the admin area */}
      <AreaSwitch store={<CartDrawer />} admin={null} />
    </CartUIProvider>
  )
}

export default Navbar
