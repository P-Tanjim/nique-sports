import React from 'react'
import Image from 'next/image'
import logo from '../../../public/logo.jpg'
import bdFlag from '../../../public/bd-flag.webp'
import usFlag from '../../../public/en-flag.webp'
import { Tabs, Button } from '@heroui/react';
import NavSearchbar from '@/components/navbar/clientComponent/NavSearchbar'
import Link from 'next/link'
import MobileNav from './clientComponent/MobileNav'

const Navbar = () => {
  return (
    <>
      <nav className='px-4 md:px-20 py-3 w-full'>
        <div className='desktop-navbar flex justify-between items-center'>
          <MobileNav />
          <Image src={logo} width={50} height={50} alt='nique sports logo' />
          <ul className='hidden min-[1003px]:flex md:gap-4 lg:gap-6 xl:gap-10 items-center text-ink ml-10'>
            <Link href={'/'}><li className='hover:text-primary transition duration-300'>Home</li></Link>
            <Link href={'/bd-premium'}><li className='hover:text-primary transition duration-300'>BD Premium</li></Link>
            <Link href={'/manufactured-retro'}><li className='hover:text-primary transition duration-300'>Manufactured Retro</li></Link>
            <Link href={'/player-edition-replica'}><li className='hover:text-primary transition duration-300'>Player Edition Replica</li></Link>
            <Link href={'/player-edition'}><li className='hover:text-primary transition duration-300'>Player Edition</li></Link>
          </ul>
          <div className='flex items-center justify-center gap-5'>
            <button
              aria-label="Search"
              className="bg-white shadow h-10 w-10 flex items-center justify-center text-gray-400 hover:text-primary rounded-full cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

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
      </nav>
    </>
  )
}

export default Navbar