import Category from "@/components/category/Category";
import Feature from "@/components/feature/Feature";
import Hero from "@/components/hero/Hero";
import Navbar from "@/components/navbar/Navbar";

export default function Home() {
  return (
    <>
      <Navbar></Navbar>
      <Hero></Hero>
      <Category></Category>
      <Feature></Feature>
    </>
  );
}
