import React from 'react'
import heroBg from '../../../public/heroImg/hero.jpg';
import Image from 'next/image';

export default function Hero() {
  return (
    <div className='mb-10'>
        {/* hero image  */}
        <Image
          src={heroBg}
          alt='NIQUE SPORTS football jerseys'
          loading='eager'
          fetchPriority='high'
          sizes='100vw'
          quality={60}
          className='w-full aspect-video'
        />
    </div>
  )
}