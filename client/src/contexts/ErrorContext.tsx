import { createContext, useContext, useState, ReactNode } from 'react';
import { Toaster, toast } from 'sonner';

interface ErrorContextType {
  showError: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const showError = (message: string) => {
    toast.error(message);
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <Toaster richColors />
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
