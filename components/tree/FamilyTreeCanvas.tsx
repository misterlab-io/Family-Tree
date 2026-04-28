"use client";

import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PersonNode } from "./PersonNode";
import { CoupleNode } from "./CoupleNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { TreeSearch } from "./TreeSearch";
import { useTreeData } from "@/hooks/useTreeData";
import { useSaveTreeLayout } from "@/hooks/useTreeLayout";

const nodeTypes = {
  personNode: PersonNode,
  coupleNode: CoupleNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

function TreeCanvas({ userId }: { userId: string }) {
  const { nodes: layoutNodes, edges, persons, isLoading, isError } =
    useTreeData(userId);
  const { mutate: saveOrder } = useSaveTreeLayout(userId);
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  // originalY: nodeId → y from the latest layout, used to lock y during drag
  const originalY = useRef<Map<string, number>>(new Map());

  // Sync local node state whenever the computed layout changes.
  // layoutNodes is memoized in useTreeData — it only gets a new reference when
  // persons, relationships, or customOrder actually change, so this effect
  // won't loop even though setNodes triggers a re-render.
  useEffect(() => {
    if (layoutNodes.length === 0) return;
    setNodes(layoutNodes);
    const yMap = new Map<string, number>();
    for (const n of layoutNodes) {
      yMap.set(n.id, n.position.y);
    }
    originalY.current = yMap;
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
    // setNodes and fitView are stable refs; only layoutNodes drives re-sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutNodes]);

  // Lock y-axis: intercept position changes and restore original y
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const locked = changes.map((change) => {
        if (change.type === "position" && change.position) {
          const origY = originalY.current.get(change.id);
          if (origY !== undefined) {
            return { ...change, position: { x: change.position.x, y: origY } };
          }
        }
        return change;
      });
      onNodesChange(locked);
    },
    [onNodesChange]
  );

  // On drag end: re-rank all persons in this generation by x and persist
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      if (draggedNode.id.startsWith("couple_")) return;
      const origY = originalY.current.get(draggedNode.id);
      if (origY === undefined) return;

      const sameGen = nodes.filter(
        (n) =>
          !n.id.startsWith("couple_") &&
          originalY.current.get(n.id) === origY
      );
      const sorted = [...sameGen].sort((a, b) => a.position.x - b.position.x);
      const orderMap = new Map<string, number>();
      sorted.forEach((n, i) => orderMap.set(n.id, i));
      saveOrder(orderMap);
    },
    [nodes, saveOrder]
  );

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
      onNodesChange={handleNodesChange}
      onNodeDragStop={handleNodeDragStop}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={false}
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
