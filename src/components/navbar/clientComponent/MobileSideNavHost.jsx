'use client';

import dynamic from 'next/dynamic';

const MobileSideNav = dynamic(() => import('./MobileSideNav'), { ssr: false });

export default function MobileSideNavHost() {
  return <MobileSideNav />;
}
