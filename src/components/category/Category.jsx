import Image from 'next/image';
import Link from 'next/link';
import catImg from '../../../public/categoryImg/catImg.webp';
import catImg2 from '../../../public/categoryImg/catImg2.webp';
import { getBanners } from '@/lib/api/banners';

export default async function Category() {
  const banners = await getBanners();
  const cat1Image = banners?.cat_manufactured_retro?.imageUrl || catImg;
  const cat2Image = banners?.cat_player_edition?.imageUrl || catImg2;

  return (
    <div className="mb-10 px-4 md:px-20 py-3 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link href="/shop?category=manufactured-retro" className="group block w-full overflow-hidden rounded-xl">
        <Image
          src={cat1Image}
          width={1080}
          height={438}
          alt="Manufactured Retro jersey Category"
          sizes="(min-width: 768px) calc(50vw - 84px), calc(100vw - 32px)"
          quality={70}
          className="block h-auto w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-102"
        />
      </Link>
      <Link href="/shop?category=player-edition" className="group block w-full overflow-hidden rounded-xl">
        <Image
          src={cat2Image}
          width={1080}
          height={429}
          alt="Player Edition Category"
          sizes="(min-width: 768px) calc(50vw - 84px), calc(100vw - 32px)"
          quality={70}
          className="block h-auto w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-102"
        />
      </Link>
    </div>
  );
}