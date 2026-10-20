import { Suspense } from "react";
import Category from "@/components/category/Category";
import Feature from "@/components/feature/Feature";
import Hero from "@/components/hero/Hero";
import ProductsSection from "@/components/products/productsSection";
import Testimonial from "@/components/testimonial/testimonial";

export default function Home() {
  return (
    <>
      <Hero />
      <Category />

      <Suspense fallback={<div className="my-10 min-h-95 w-full" aria-hidden="true" />}>
        <Feature />
      </Suspense>

      <Suspense fallback={<div className="my-10 min-h-150 w-full" aria-hidden="true" />}>
        <ProductsSection />
      </Suspense>

      <Suspense fallback={<div className="py-20 min-h-105 w-full" aria-hidden="true" />}>
        <Testimonial />
      </Suspense>
    </>
  );
}
