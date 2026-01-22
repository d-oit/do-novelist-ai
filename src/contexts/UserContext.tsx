import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import {
  getTheme,
  setTheme,
  getOrCreateUserSettings,
} from '@/lib/database/services/user-settings-service';
import { logger } from '@/lib/logging/logger';
import { storageAdapter, KV_NAMESPACES } from '@/lib/storage-adapter';

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
  const [userId, setUserId] = useState<string>(generateUserId());
  const [isUserIdLoaded, setIsUserIdLoaded] = useState(false);

  // Load userId from storage on mount
  useEffect(() => {
    const loadUserId = async (): Promise<void> => {
      try {
        const storedUserId = await storageAdapter.get<string>(KV_NAMESPACES.USER, 'userId');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          // Save the generated userId
          await storageAdapter.set(KV_NAMESPACES.USER, 'userId', userId);
        }
      } catch (error) {
        logger.error('Failed to load userId from storage', {
          component: 'UserContext',
          error,
        });
      } finally {
        setIsUserIdLoaded(true);
      }
    };

    void loadUserId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store userId to storage when it changes
  useEffect(() => {
    if (isUserIdLoaded) {
      void storageAdapter.set(KV_NAMESPACES.USER, 'userId', userId);
    }
  }, [userId, isUserIdLoaded]);

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
        logger.error('Failed to load theme from database', {
          component: 'UserContext',
          error,
        });
        // Use default theme
        setThemeState('light');
      } finally {
        setIsInitialized(true);
      }
    };

    void loadTheme();
  }, [userId]);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    if (isInitialized) {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    }
  }, [theme, isInitialized]);

  const handleSetTheme = async (newTheme: 'light' | 'dark' | 'system'): Promise<void> => {
    setThemeState(newTheme);

    try {
      // Save to Turso
      await setTheme(userId, newTheme);
    } catch (error) {
      logger.error('Failed to save theme to database', {
        component: 'UserContext',
        error,
      });
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
