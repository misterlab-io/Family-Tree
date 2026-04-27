"use client";

import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PersonNode } from "./PersonNode";
import { CoupleNode } from "./CoupleNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { TreeSearch } from "./TreeSearch";
import { useTreeData } from "@/hooks/useTreeData";

const nodeTypes = {
  personNode: PersonNode,
  coupleNode: CoupleNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

function TreeCanvas({ userId }: { userId: string }) {
  const { nodes, edges, persons, isLoading, isError } = useTreeData(userId);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
    }
  }, [nodes.length, fitView]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">Gagal memuat data pohon.</p>
      </div>
    );
  }

  if (persons.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-6xl">🌱</span>
        <h2 className="text-xl font-bold">Pohon masih kosong</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Mulai dengan menambahkan anggota keluarga pertama.
        </p>
        <Link
          href="/members/new"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="size-4" />
          Tambah Anggota
        </Link>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls showInteractive={false} className="!bottom-24 !left-3" />
      <MiniMap
        className="!bottom-24 !right-3 !hidden md:!block"
        nodeStrokeWidth={3}
        zoomable
        pannable
      />

      <TreeSearch persons={persons} />

      {/* FAB tambah anggota */}
      <div className="absolute bottom-4 right-4 z-10">
        <Link
          href="/members/new"
          className="flex size-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Tambah anggota"
        >
          <Plus className="size-6 text-primary-foreground" />
        </Link>
      </div>
    </ReactFlow>
  );
}

export function FamilyTreeCanvas({ userId }: { userId: string }) {
  return (
    <ReactFlowProvider>
      <TreeCanvas userId={userId} />
    </ReactFlowProvider>
  );
}
