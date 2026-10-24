import Image from 'next/image';
import heroBg from '../../../public/heroImg/hero.webp';
import { getBanners } from '@/lib/api/banners';

export default async function Hero() {
  const banners = await getBanners();
  const heroImage = banners?.hero_banner?.imageUrl || heroBg;

  return (
    <div className="mb-10 w-full overflow-hidden">
      {/* Hero Banner */}
      <Image
        src={heroImage}
        alt="NIQUE SPORTS football jerseys"
        priority
        fetchPriority="high"
        sizes="100vw"
        width={1920}
        height={1080}
        quality={75}
        className="w-full aspect-video object-cover"
      />
    </div>
  );
}