"use client";

import { AuthGate } from "@/components/AuthGate";
import { MedicineScheduleSection } from "@/components/settings/MedicineScheduleSection";
import { SettingsSubpage } from "@/components/settings/SettingsSubpage";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <SettingsSubpage title="Nhắc thuốc">
            <MedicineScheduleSection baby={ctx.baby} />
          </SettingsSubpage>
        ) : null
      }
    </AuthGate>
  );
}
