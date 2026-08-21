import { dancingScript } from '@/app/layout'
import React from 'react'
import TestimonialCarousel from './clientComponent/cards';
import customer1 from '../../../public/customer/customer-1.webp'
import customer2 from '../../../public/customer/customer-2.jpg'
import customer3 from '../../../public/customer/customer-3.jpg'
import customer4 from '../../../public/customer/customer-4.jpg'
import customer5 from '../../../public/customer/customer-5.jpg'

const DEFAULT_TESTIMONIALS = [
  {
    id: 1,
    image: customer1,
    name: "Amara Chen",
    subtitle: "Product Lead, Nova",
  },
  {
    id: 2,
    image: customer2,
    name: "Rahim Islam",
    subtitle: "Founder, Studio Loop",
  },
  {
    id: 3,
    image: customer3,
    name: "Elena Petrova",
    subtitle: "CTO, Fieldwork",
  },
  {
    id: 4,
    image: customer4,
    name: "Marcus Webb",
    subtitle: "Growth, Lumen",
  },
  {
    id: 5,
    image: customer5,
    name: "Priya Nair",
    subtitle: "Design Director, Arclight",
  },
];
const Testimonial = () => {
  return (
    <div>
        <h1 className={`text-center mb-10 text-4xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>Customers</h1>
        <div className="bg-white">
      <div className="mx-auto max-w-4xl overflow-clip">
        <TestimonialCarousel
          testimonials={DEFAULT_TESTIMONIALS}
          autoPlay={true}
          autoPlayInterval={5500}
        />
      </div>
    </div>
    </div>
  )
}

export default Testimonial