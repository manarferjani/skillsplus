// src/context/SidebarContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <SidebarContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </SidebarContext.Provider>
  );
};