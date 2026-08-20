import Image from 'next/image'
import React from 'react'
import catImg from '../../../public/heroImg/hero.jpg'

const Category = () => {
  return (
    <>
      <div className='mb-10 px-4 md:px-20 py-3 w-full grid grid-cols-1 md:grid-cols-2 gap-2'>
        <Image src={catImg} width={500} height={500} alt="BD Premium jersey Category" className='object-cover rounded-xl h-full w-full'></Image>
        <Image src={catImg} width={500} height={500} alt="Manufactured by Nique Sports Category" className='object-cover rounded-xl h-full w-full'></Image>
        <Image src={catImg} width={500} height={500} alt="Player Edition ReplicaCategory" className='object-cover rounded-xl h-full w-full'></Image>
        <Image src={catImg} width={500} height={500} alt="Player Edition Category" className='object-cover rounded-xl h-full w-full'></Image>
      </div>
    </>
  )
}

export default Category