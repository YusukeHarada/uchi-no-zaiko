"use client";

import { HouseholdSettingsView } from "@/components/settings/household-settings-view";
import { useHouseholdId } from "@/lib/firebase/household-context";

export default function HouseholdSettingsPage() {
  const householdId = useHouseholdId();
  return <HouseholdSettingsView householdId={householdId} />;
}
