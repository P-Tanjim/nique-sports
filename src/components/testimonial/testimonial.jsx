import { dancingScript } from '@/app/fonts'
import React from 'react'
import TestimonialCarousel from './clientComponent/cards';
import { getTestimonials } from '@/lib/api/requests/testimonial';

const Testimonial = async () => {
  const testimonials = await getTestimonials();

  // Fallback if DB is empty
  if (!testimonials || testimonials.length === 0) {
    return null; 
  }
  return (
    <div className='py-20'>
        <h1 className={`text-center mb-10 text-5xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>Customers</h1>
        <div className="bg-white">
      <div className="mx-auto max-w-4xl overflow-clip">
        <TestimonialCarousel
          testimonials={testimonials}
          autoPlay={true}
          autoPlayInterval={3500}
        />
      </div>
    </div>
    </div>
  )
}

export default Testimonial