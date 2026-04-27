"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import type { Person } from "@/lib/types";

interface TreeSearchProps {
  persons: Person[];
}

export function TreeSearch({ persons }: TreeSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { fitView } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? persons.filter((p) =>
        p.full_name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  function handleSelect(personId: string) {
    fitView({ nodes: [{ id: personId }], duration: 500, padding: 0.6 });
    setQuery("");
    setOpen(false);
  }

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className="absolute left-3 top-3 z-10 w-52">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cari anggota..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Hapus"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
          {filtered.map((p) => (
            <button
              key={p.id}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {p.full_name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{p.full_name}</span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() !== "" && filtered.length === 0 && (
        <div className="mt-1 rounded-lg border border-border bg-background px-3 py-3 shadow-lg">
          <p className="text-sm text-muted-foreground">Tidak ditemukan.</p>
        </div>
      )}
    </div>
  );
}
