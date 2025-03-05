'use client';

import { useEffect, useState } from 'react';
import ChatArea from '@/components/layout/ChatArea';
import ChatHistory from '@/components/layout/ChatHistory';
import { LocationProvider } from '@/contexts/LocationContext';

export default function LocationPage({
  params
}: {
  params: { locationId: string }
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userName, setUserName] = useState<string>('Guest');
  const maxRetries = 3;

  // Get location name from URL
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const locationName = searchParams.get('locationName');
      console.log('Location name from URL:', locationName);
      
      if (locationName && locationName.trim() !== '') {
        setUserName(locationName.trim());
      }
    } catch (err) {
      console.error('Error reading location name:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function initializeUser() {
      if (!params.locationId) {
        setError('No location ID provided');
        return;
      }

      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            locationId: params.locationId,
            name: userName
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to initialize user');
        }

        const data = await response.json();
        console.log('User initialized:', data.user);
        
        if (isMounted) {
          setIsInitialized(true);
          setError(null);
          setRetryCount(0);
          // Update userName from user data if available and not already set
          if (data.user?.full_name && userName === 'Guest') {
            setUserName(data.user.full_name);
          }
        }
      } catch (err) {
        console.error('Error initializing user:', err);
        if (isMounted) {
          if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            retryTimeout = setTimeout(() => {
              initializeUser();
            }, Math.pow(2, retryCount) * 1000); // Exponential backoff
          } else {
            setError('Failed to initialize user after multiple attempts. Please refresh the page.');
          }
        }
      }
    }

    initializeUser();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [params.locationId, retryCount, userName]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-orange-blue">
        <div className="text-white text-xl p-4 bg-red-500/20 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-orange-blue">
        <div className="text-white text-xl">
          {retryCount > 0 ? `Retrying... (Attempt ${retryCount}/${maxRetries})` : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <LocationProvider>
      <div className="flex h-screen bg-gradient-orange-blue">
        <ChatHistory />
        <ChatArea userName={userName} />
      </div>
    </LocationProvider>
  );
}
