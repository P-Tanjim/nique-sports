import React from 'react'
import heroBg from '../../../public/heroImg/hero.jpg';
import Image from 'next/image';

export default function Hero() {
  return (
    <div className='mb-10'>
        {/* hero image  */}
        <Image loading='eager' src={heroBg} alt='hero-background' className='w-full aspect-video' />
    </div>
  )
}