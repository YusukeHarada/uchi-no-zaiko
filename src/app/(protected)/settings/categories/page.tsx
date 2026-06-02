"use client";

import { CategorySettingsView } from "@/components/settings/category-settings-view";
import { useHouseholdId } from "@/lib/firebase/household-context";

export default function CategorySettingsPage() {
  const householdId = useHouseholdId();
  return <CategorySettingsView householdId={householdId} />;
}
