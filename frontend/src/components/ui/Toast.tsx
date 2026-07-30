"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, toast } from "sonner";

export { toast };

export function Toast(props: React.ComponentProps<typeof SonnerToaster>) {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      toastOptions={{
        style: {
          background: "var(--color-bg-elevated-2)",
          border: "1px solid var(--color-border-subtle)",
          color: "var(--color-fg-primary)",
          borderRadius: "var(--radius-lg)",
        },
      }}
      {...props}
    />
  );
}
