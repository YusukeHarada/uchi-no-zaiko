"use client";

import { ShoppingListView } from "@/components/shopping/shopping-list-view";
import { useHouseholdId } from "@/lib/firebase/household-context";

export default function ShoppingPage() {
  const householdId = useHouseholdId();
  return <ShoppingListView householdId={householdId} />;
}
