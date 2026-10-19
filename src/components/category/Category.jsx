import Image from 'next/image'
import React from 'react'
import catImg from '../../../public/categoryImg/catImg.webp'
import catImg2 from '../../../public/categoryImg/catImg2.webp'
import Link from 'next/link'

const Category = () => {
  return (
    <>
      <div className='mb-10 px-4 md:px-20 py-3 w-full grid grid-cols-1 md:grid-cols-2 gap-2'>
        <Link href={`/shop?category=manufactured-retro`}><Image src={catImg} width={500} height={500} alt="BD Premium jersey Category" sizes="(min-width: 768px) calc(50vw - 84px), calc(100vw - 32px)" quality={60} className='object-cover rounded-xl h-full w-full'></Image></Link>
        <Link href={`/shop?category=player-edition`}><Image src={catImg2} width={500} height={500} alt="Player Edition Category" sizes="(min-width: 768px) calc(50vw - 84px), calc(100vw - 32px)" quality={60} className='object-cover rounded-xl h-full w-full'></Image></Link>
      </div>
    </>
  )
}

export default Category