import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getOrCreateUser } from '../lib/database';

export function useAuth() {
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function initializeAuth() {
      try {
        // Extract location ID from URL
        const pathParts = window.location.pathname.split('/');
        const locationIdIndex = pathParts.indexOf('location') + 1;
        if (locationIdIndex > 0 && locationIdIndex < pathParts.length) {
          const id = pathParts[locationIdIndex];
          setLocationId(id);

          // Get or create user in Supabase
          await getOrCreateUser(id);
        } else {
          throw new Error('Location ID not found in URL');
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Authentication failed'));
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  return { locationId, isLoading, error };
}
