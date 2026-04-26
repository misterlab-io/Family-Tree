export default function TreeLoading() {
  return (
    <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Memuat pohon keluarga…</p>
      </div>
    </div>
  );
}
