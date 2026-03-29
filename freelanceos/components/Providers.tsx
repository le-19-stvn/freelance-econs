"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </ToastProvider>
  );
}
