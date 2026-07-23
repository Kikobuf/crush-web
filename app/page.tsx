import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}
