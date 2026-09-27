import Image from 'next/image'
import React from 'react'
import catImg from '../../../public/categoryImg/catImg.webp'
import catImg2 from '../../../public/categoryImg/catImg2.webp'
import Link from 'next/link'

const Category = () => {
  return (
    <>
      <div className='mb-10 px-4 md:px-20 py-3 w-full grid grid-cols-1 md:grid-cols-2 gap-2'>
        <Link href={`/shop?category=manufactured-retro`}><Image loading='eager' src={catImg} width={500} height={500} alt="BD Premium jersey Category" className='object-cover rounded-xl h-full w-full'></Image></Link>
        <Link href={`/shop?category=player-edition`}><Image loading='eager' src={catImg2} width={500} height={500} alt="Player Edition Category" className='object-cover rounded-xl h-full w-full'></Image></Link>
      </div>
    </>
  )
}

export default Category