"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export { toast };

export function Toast(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "#1d1f35",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fafafa",
          borderRadius: "12px",
        },
      }}
      {...props}
    />
  );
}
