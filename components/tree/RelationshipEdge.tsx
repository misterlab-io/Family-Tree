"use client";

import { memo } from "react";
import {
  getStraightPath,
  EdgeProps,
  BaseEdge,
} from "@xyflow/react";

const EDGE_STYLES: Record<string, React.CSSProperties> = {
  spouse: { stroke: "#3b82f6", strokeWidth: 2 },
  ex_spouse: { stroke: "#94a3b8", strokeWidth: 2, strokeDasharray: "5 4" },
  parent_child: { stroke: "#1e293b", strokeWidth: 1.5 },
  sibling: { stroke: "#7dd3fc", strokeWidth: 1.5 },
};

function RelationshipEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const relType = (data?.relType as string) ?? "parent_child";
  const style = EDGE_STYLES[relType] ?? EDGE_STYLES.parent_child;

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return <BaseEdge path={edgePath} style={style} />;
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
