"use client";

import { InventoryView } from "@/components/inventory/inventory-view";
import { useHouseholdId } from "@/lib/firebase/household-context";

export default function InventoryPage() {
  const householdId = useHouseholdId();
  return <InventoryView householdId={householdId} />;
}
