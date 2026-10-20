import Image from 'next/image'
import React from 'react'
import catImg from '../../../public/categoryImg/catImg.webp'
import catImg2 from '../../../public/categoryImg/catImg2.webp'
import Link from 'next/link'

const Category = () => {
  return (
    <>
      <div className='mb-10 px-4 md:px-20 py-3 w-full grid grid-cols-1 md:grid-cols-2 gap-2'>
        <Link href={`/shop?category=manufactured-retro`} className="block w-full">
          <Image src={catImg} width={1080} height={438} alt="BD Premium jersey Category" sizes="(min-width: 768px) calc(50vw - 84px), calc(100vw - 32px)" quality={55} className="block h-auto w-full rounded-xl object-cover" />
        </Link>
        <Link href={`/shop?category=player-edition`} className="block w-full">
          <Image src={catImg2} width={1080} height={429} alt="Player Edition Category" sizes="(min-width: 768px) calc(50vw - 84px), calc(100vw - 32px)" quality={55} className="block h-auto w-full rounded-xl object-cover" />
        </Link>
      </div>
    </>
  )
}

export default Category