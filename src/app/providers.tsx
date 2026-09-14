"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
