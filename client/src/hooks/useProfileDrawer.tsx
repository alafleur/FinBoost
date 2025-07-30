import { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileDrawerState {
  isOpen: boolean;
  initialSection?: string;
  openProfileDrawer: (section?: string) => void;
  closeProfileDrawer: () => void;
}

const ProfileDrawerContext = createContext<ProfileDrawerState | undefined>(undefined);

export const ProfileDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialSection, setInitialSection] = useState<string | undefined>(undefined);

  const openProfileDrawer = (section?: string) => {
    setInitialSection(section);
    setIsOpen(true);
  };

  const closeProfileDrawer = () => {
    setIsOpen(false);
    setInitialSection(undefined);
  };

  return (
    <ProfileDrawerContext.Provider value={{
      isOpen,
      initialSection,
      openProfileDrawer,
      closeProfileDrawer,
    }}>
      {children}
    </ProfileDrawerContext.Provider>
  );
};

export const useProfileDrawer = () => {
  const context = useContext(ProfileDrawerContext);
  if (context === undefined) {
    throw new Error('useProfileDrawer must be used within a ProfileDrawerProvider');
  }
  return context;
};