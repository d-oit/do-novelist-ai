import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import {
  getTheme,
  setTheme,
  getOrCreateUserSettings,
} from '@/lib/database/services/user-settings-service';
import { logger } from '@/lib/logging/logger';

interface UserContextType {
  userId: string;
  setUserId: (userId: string) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'novelist_user_id';

function generateUserId(): string {
  // Use crypto.getRandomValues for cryptographically secure random values
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const randomString = Array.from(randomBytes)
    .map(b => b.toString(36))
    .join('')
    .slice(0, 10);

  return `user_${Date.now()}_${randomString}`;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string>((): string => {
    // Initialize with existing userId or generate new one
    const storedUserId = localStorage.getItem(STORAGE_KEY);
    if (storedUserId !== null && storedUserId !== '') {
      return storedUserId;
    }
    return generateUserId();
  });

  // Store userId to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, userId);
  }, [userId]);

  // eslint-disable-next-line react/hook-use-state
  const [theme, setThemeState] = useState('light' as 'light' | 'dark' | 'system');
  const [isInitialized, setIsInitialized] = useState(false as boolean);

  // Load theme from Turso/localStorage on mount
  useEffect(() => {
    const loadTheme = async (): Promise<void> => {
      try {
        const userTheme = await getTheme(userId);
        setThemeState(userTheme);

        // Initialize user settings in Turso if they don't exist
        await getOrCreateUserSettings(userId);
      } catch (error) {
        logger.error('Failed to load theme from database, using localStorage fallback', {
          component: 'UserContext',
          error,
        });
        // Fallback to localStorage if Turso fails
        const storedTheme = localStorage.getItem('novelist-theme') as
          | 'light'
          | 'dark'
          | 'system'
          | null;
        setThemeState(storedTheme ?? 'light');
      } finally {
        setIsInitialized(true);
      }
    };

    void loadTheme();
  }, [userId]);

  const handleSetTheme = async (newTheme: 'light' | 'dark' | 'system'): Promise<void> => {
    setThemeState(newTheme);

    try {
      // Try to save to Turso
      await setTheme(userId, newTheme);
    } catch (error) {
      logger.error('Failed to save theme to database, using localStorage fallback', {
        component: 'UserContext',
        error,
      });
      // Fallback to localStorage if Turso fails
      localStorage.setItem('novelist-theme', newTheme);
    }
  };

  const value: UserContextType = {
    userId,
    setUserId,
    theme: isInitialized ? theme : 'light', // Show default while initializing
    setTheme: handleSetTheme,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
