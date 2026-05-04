"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg-base font-sans">
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-error/20 bg-error/10"
          >
            <AlertTriangle className="h-9 w-9 text-error" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="space-y-3"
          >
            <h1 className="font-serif text-4xl tracking-tight text-fg-primary">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-fg-secondary max-w-sm">
              Quelque chose s'est mal passé. Veuillez réessayer ou contacter le support si le problème persiste.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={reset}
            className="flex items-center gap-2 rounded-2xl aurora-bg px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)] transition-opacity hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </motion.button>
        </div>
      </body>
    </html>
  );
}
