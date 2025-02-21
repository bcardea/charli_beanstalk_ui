import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface LocationContextType {
  locationId: string | null;
  setLocationId: (id: string | null) => void;
}

const LocationContext = createContext<LocationContextType>({
  locationId: null,
  setLocationId: () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationId, setLocationId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Extract location ID from pathname
    const id = pathname?.split('/')[1];
    if (id) {
      console.log('Setting location ID from pathname:', id);
      setLocationId(id);
    }
  }, [pathname]);

  return (
    <LocationContext.Provider value={{ locationId, setLocationId }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
