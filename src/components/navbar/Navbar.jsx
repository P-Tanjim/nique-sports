import React from 'react'
import Image from 'next/image'
import logo from '../../../public/logo.jpg'
import bdFlag from '../../../public/bd-flag.webp'
import usFlag from '../../../public/en-flag.webp'
import { Tabs } from '@heroui/react';
import NavSearchbar from '@/components/navbar/clientComponent/NavSearchbar'
import Link from 'next/link'
import MobileSideNav from './clientComponent/MobileSideNav'
import { ChartBarStacked, CircleUser, House, ShoppingCart } from 'lucide-react'

const Navbar = () => {
  return (
    <>
      <nav className='px-4 md:px-20 py-3 w-full flex flex-col'>
        <div className='desktop-navbar flex justify-between items-center'>
          <MobileSideNav where={'navbar'} />
          <Image src={logo} width={50} height={50} alt='nique sports logo' />
          <ul className='hidden min-[1003px]:flex md:gap-4 lg:gap-6 xl:gap-10 items-center text-ink ml-10'>
            <Link href={'/'}><li className='hover:text-primary transition duration-300'>Home</li></Link>
            <Link href={'/bd-premium'}><li className='hover:text-primary transition duration-300'>BD Premium</li></Link>
            <Link href={'/manufactured-retro'}><li className='hover:text-primary transition duration-300'>Manufactured Retro</li></Link>
            <Link href={'/player-edition-replica'}><li className='hover:text-primary transition duration-300'>Player Edition Replica</li></Link>
            <Link href={'/player-edition'}><li className='hover:text-primary transition duration-300'>Player Edition</li></Link>
          </ul>
          <div className='flex items-center justify-center gap-5'>
            <NavSearchbar />

            <Tabs className="w-fit h-auto hidden min-[1003px]:flex">
              <Tabs.ListContainer>
                <Tabs.List aria-label="Options">
                  <Tabs.Tab id="overview">
                    <Image src={bdFlag} width={18} height={18} alt="Home Icon" />
                    <Tabs.Indicator className='px-2 py-2' />
                  </Tabs.Tab>
                  <Tabs.Tab id="analytics">
                    <Image src={usFlag} width={18} height={18} alt="Home Icon" />
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          </div>
        </div>

        <div className='absolute bottom-5 mobile-nav w-[90%] mx-auto py-4 px-6 rounded-full drackdrop-blur-sm bg-primary/80 min-[1003px]:hidden'>
          <ul className='flex flex-row justify-between items-center'>
            <Link href={'/'}>
              <li><House size={28} color="#ffffff" /></li>
            </Link>
            <li><ChartBarStacked size={28} color="#ffffff" /></li>
            <li><ShoppingCart size={28} color="#ffffff" /></li>
            <Link href={'/account'}>
              <li><CircleUser size={28} color="#ffffff" /></li>
            </Link>
          </ul>

        </div>
      </nav>
    </>
  )
}

export default Navbar