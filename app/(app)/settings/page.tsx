"use client";

import { useRouter } from "next/navigation";
import { Monitor, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "auto", label: "Otomatis", icon: <Monitor className="size-5" /> },
  { value: "light", label: "Terang", icon: <Sun className="size-5" /> },
  { value: "dark", label: "Gelap", icon: <Moon className="size-5" /> },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      {/* Tema */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Tampilan</h2>
          <p className="text-sm text-muted-foreground">Pilih tema aplikasi</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={[
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent",
                ].join(" ")}
              >
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="h-px bg-border" />

      {/* Akun */}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Akun</h2>
        <Button variant="outline" onClick={handleLogout} className="w-full">
          Keluar
        </Button>
      </section>
    </div>
  );
}
