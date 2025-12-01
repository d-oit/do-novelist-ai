import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  userId: string;
  setUserId: (userId: string) => void;
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
  const [userId, setUserIdState] = useState<string>(() => {
    // Initialize with existing userId or generate new one
    const storedUserId = localStorage.getItem(STORAGE_KEY);
    if (storedUserId !== null && storedUserId !== '') {
      return storedUserId;
    }
    const newUserId = generateUserId();
    localStorage.setItem(STORAGE_KEY, newUserId);
    return newUserId;
  });

  // Save userId to localStorage whenever it changes
  const setUserId = (newUserId: string): void => {
    setUserIdState(newUserId);
    localStorage.setItem(STORAGE_KEY, newUserId);
  };

  const value: UserContextType = {
    userId,
    setUserId,
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
