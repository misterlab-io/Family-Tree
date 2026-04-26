"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CoupleNodeData } from "@/lib/tree/layout";

function CoupleNodeComponent({ data }: NodeProps) {
  const { coupleType } = data as unknown as CoupleNodeData;

  return (
    <div className="relative flex size-2 items-center justify-center">
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="target" position={Position.Right} className="!opacity-0" />
      {/* Tiny visible dot for debugging — can remove later */}
      <div
        className={`size-2 rounded-full ${
          coupleType === "ex_spouse" ? "bg-gray-400" : "bg-blue-400"
        }`}
      />
    </div>
  );
}

export const CoupleNode = memo(CoupleNodeComponent);
