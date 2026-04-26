"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl">⚠️</span>
      <h2 className="text-lg font-bold">Terjadi kesalahan</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        {error.message || "Sesuatu tidak berjalan dengan benar."}
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
