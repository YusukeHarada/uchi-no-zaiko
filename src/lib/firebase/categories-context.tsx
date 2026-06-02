"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { subscribeToCategories } from "@/lib/firebase/categories";
import { useHouseholdId } from "@/lib/firebase/household-context";
import type { Category } from "@/lib/types/inventory";

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  byId: Map<string, Category>;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: [],
  loading: true,
  byId: new Map(),
});

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const householdId = useHouseholdId();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToCategories(
      householdId,
      (list) => {
        setCategories(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [householdId]);

  const value = useMemo<CategoriesContextValue>(() => {
    const byId = new Map<string, Category>();
    for (const c of categories) byId.set(c.id, c);
    return { categories, loading, byId };
  }, [categories, loading]);

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
