// dreams-store.tsx — in-memory register seeded with the sample dreams.
// (Persistence to a device DB comes in the wire-up phase.)
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { DREAMS, type Dream } from './dreams';

type DreamsStore = {
  dreams: Dream[];
  addDream: (d: Dream) => void;
  getById: (id: string) => Dream | undefined;
};

const DreamsContext = createContext<DreamsStore | null>(null);

export function DreamsProvider({ children }: { children: ReactNode }) {
  const [dreams, setDreams] = useState<Dream[]>(DREAMS);

  const addDream = useCallback((d: Dream) => setDreams((p) => [d, ...p]), []);
  const getById = useCallback((id: string) => dreams.find((d) => d.id === id), [dreams]);

  const value = useMemo<DreamsStore>(() => ({ dreams, addDream, getById }), [dreams, addDream, getById]);
  return <DreamsContext.Provider value={value}>{children}</DreamsContext.Provider>;
}

export function useDreams(): DreamsStore {
  const ctx = useContext(DreamsContext);
  if (!ctx) throw new Error('useDreams must be used within DreamsProvider');
  return ctx;
}
