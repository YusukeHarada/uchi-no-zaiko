"use client";

import { createContext, useContext, type ReactNode } from "react";

const HouseholdContext = createContext<string | null>(null);

export function HouseholdProvider({
  householdId,
  children,
}: {
  householdId: string;
  children: ReactNode;
}) {
  return (
    <HouseholdContext.Provider value={householdId}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdId(): string {
  const id = useContext(HouseholdContext);
  if (!id) {
    throw new Error("useHouseholdId must be used inside HouseholdProvider");
  }
  return id;
}
