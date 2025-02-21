'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Get location ID from URL if present
    const pathParts = window.location.pathname.split('/');
    const locationId = pathParts[1];
    
    if (locationId && locationId !== '') {
      router.push(`/${locationId}`);
    }
  }, [router]);

  return null;
}
