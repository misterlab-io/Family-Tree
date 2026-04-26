import { createClient } from "@/lib/supabase/server";

export default async function TreePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "kamu";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🌳</div>
      <h1 className="text-2xl font-bold">Halo, {name}!</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Pohon keluargamu akan muncul di sini. Mulai dengan menambahkan anggota
        keluarga.
      </p>
      <a
        href="/members/new"
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Tambah Anggota Pertama
      </a>
    </div>
  );
}
