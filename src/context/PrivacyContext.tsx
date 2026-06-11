import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { formatCurrency, HIDDEN_CURRENCY } from '../utils/formatters';

interface PrivacyContextValue {
  hideValues: boolean;
  toggleHideValues: () => void;
  /** Formata moeda respeitando o modo privacidade */
  money: (value: number) => string;
}

const STORAGE_KEY = 'couplefinances:hide-values';

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideValues, setHideValues] = useState<boolean>(
    () => window.localStorage.getItem(STORAGE_KEY) === '1',
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, hideValues ? '1' : '0');
  }, [hideValues]);

  const toggleHideValues = useCallback(() => setHideValues((v) => !v), []);

  const money = useCallback(
    (value: number) => (hideValues ? HIDDEN_CURRENCY : formatCurrency(value)),
    [hideValues],
  );

  return (
    <PrivacyContext.Provider value={{ hideValues, toggleHideValues, money }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = (): PrivacyContextValue => {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy deve ser usado dentro de PrivacyProvider');
  return ctx;
};
