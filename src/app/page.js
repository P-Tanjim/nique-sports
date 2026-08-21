import Category from "@/components/category/Category";
import Feature from "@/components/feature/Feature";
import Hero from "@/components/hero/Hero";
import Navbar from "@/components/navbar/Navbar";
import ProductsSection from "@/components/products/productsSection";

export default function Home() {
  return (
    <>
      <Hero></Hero>
      <Category></Category>
      <Feature></Feature>
      <ProductsSection></ProductsSection>
    </>
  );
}
