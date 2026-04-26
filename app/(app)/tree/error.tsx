"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TreeError({
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
    <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl">🌵</span>
      <h2 className="text-lg font-bold">Pohon gagal dimuat</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        Coba refresh halaman atau periksa koneksi internet.
      </p>
      <Button onClick={reset}>Muat Ulang</Button>
    </div>
  );
}
