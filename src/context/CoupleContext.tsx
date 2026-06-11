import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Couple, PersonKey } from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from './AuthContext';

interface CoupleContextValue {
  couple: Couple | null;
  loading: boolean;
  /** Quem sou eu neste casal (define o lado padrão dos lançamentos) */
  myPerson: PersonKey;
  /** O(a) parceiro(a) já entrou com a própria conta? */
  partnerLinked: boolean;
  createCouple: () => Promise<string | null>;
  joinCouple: (code: string) => Promise<string | null>;
  regenerateInviteCode: () => Promise<string | null>;
}

const CoupleContext = createContext<CoupleContextValue | undefined>(undefined);

function extractError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String(err.message);
  return 'Algo deu errado. Tente novamente.';
}

export const CoupleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset síncrono quando o usuário muda (ajuste de estado durante o render)
  const userId = user?.id ?? null;
  const [loadedForUser, setLoadedForUser] = useState<string | null>(null);
  if (loadedForUser !== userId) {
    setLoadedForUser(userId);
    setCouple(null);
    setLoading(userId !== null);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    StorageService.loadCouple()
      .then((loaded) => {
        if (!cancelled) setCouple(loaded);
      })
      .catch((err) => console.error('Erro ao carregar casal:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const createCouple = useCallback(async (): Promise<string | null> => {
    try {
      const created = await StorageService.createCouple();
      setCouple(created);
      return null;
    } catch (err) {
      return extractError(err);
    }
  }, []);

  const joinCouple = useCallback(async (code: string): Promise<string | null> => {
    try {
      const joined = await StorageService.joinCouple(code);
      setCouple(joined);
      return null;
    } catch (err) {
      return extractError(err);
    }
  }, []);

  const regenerateInviteCode = useCallback(async (): Promise<string | null> => {
    try {
      const code = await StorageService.regenerateInviteCode();
      setCouple((prev) => (prev ? { ...prev, inviteCode: code } : prev));
      return code;
    } catch (err) {
      console.error('Erro ao gerar código:', err);
      return null;
    }
  }, []);

  const myPerson: PersonKey = couple && user && couple.person2UserId === user.id ? 'person2' : 'person1';
  const partnerLinked = !!couple && !!couple.person1UserId && !!couple.person2UserId;

  return (
    <CoupleContext.Provider
      value={{ couple, loading, myPerson, partnerLinked, createCouple, joinCouple, regenerateInviteCode }}
    >
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = (): CoupleContextValue => {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error('useCouple deve ser usado dentro de CoupleProvider');
  return ctx;
};
