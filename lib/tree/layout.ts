import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { Person, Relationship } from "@/lib/types";

const PERSON_W = 168;
const PERSON_H = 80;
const COUPLE_SIZE = 8;
const NODE_SEP = 60;
const RANK_SEP = 100;

export type PersonNodeData = Person & { type: "personNode" };
export type CoupleNodeData = { coupleType: "spouse" | "ex_spouse" };

// ─── Main export ─────────────────────────────────────────────────────────────

export function buildTreeLayout(
  persons: Person[],
  relationships: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  if (persons.length === 0) return { nodes: [], edges: [] };

  const spouseRels = relationships.filter(
    (r) => r.relationship_type === "spouse" || r.relationship_type === "ex_spouse"
  );
  const parentChildRels = relationships.filter(
    (r) => r.relationship_type === "parent_child"
  );
  const siblingRels = relationships.filter(
    (r) => r.relationship_type === "sibling"
  );

  // ── 1. Build couple nodes ──────────────────────────────────────────────────
  // coupleId → { personA, personB, coupleType }
  const coupleMap = new Map<
    string,
    { personA: string; personB: string; coupleType: "spouse" | "ex_spouse" }
  >();

  for (const rel of spouseRels) {
    const coupleId = `couple_${rel.id}`;
    coupleMap.set(coupleId, {
      personA: rel.person_a_id,
      personB: rel.person_b_id,
      coupleType: rel.relationship_type as "spouse" | "ex_spouse",
    });
  }

  // ── 2. Build lookup: pairKey → coupleId ───────────────────────────────────
  const pairToCouple = new Map<string, string>();
  for (const [coupleId, c] of coupleMap) {
    pairToCouple.set(`${c.personA}:${c.personB}`, coupleId);
    pairToCouple.set(`${c.personB}:${c.personA}`, coupleId);
  }

  // ── 3. For each child: find which couple node serves as their parent ───────
  // childId → [parentId]
  const childToParents = new Map<string, string[]>();
  for (const rel of parentChildRels) {
    const arr = childToParents.get(rel.person_b_id) ?? [];
    arr.push(rel.person_a_id);
    childToParents.set(rel.person_b_id, arr);
  }

  // childId → coupleId | null
  const childToCouple = new Map<string, string | null>();
  for (const [childId, parents] of childToParents) {
    let found: string | null = null;
    outer: for (let i = 0; i < parents.length; i++) {
      for (let j = i + 1; j < parents.length; j++) {
        const cId =
          pairToCouple.get(`${parents[i]}:${parents[j]}`) ??
          pairToCouple.get(`${parents[j]}:${parents[i]}`);
        if (cId) {
          found = cId;
          break outer;
        }
      }
    }
    childToCouple.set(childId, found);
  }

  // ── 4. Build Dagre graph ───────────────────────────────────────────────────
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const person of persons) {
    g.setNode(person.id, { width: PERSON_W, height: PERSON_H });
  }
  for (const [coupleId] of coupleMap) {
    g.setNode(coupleId, { width: COUPLE_SIZE, height: COUPLE_SIZE });
  }

  // Spouse → couple node edges (positions couple between the two persons)
  for (const [coupleId, c] of coupleMap) {
    g.setEdge(c.personA, coupleId, { weight: 2 });
    g.setEdge(c.personB, coupleId, { weight: 2 });
  }

  // Parent-child edges (deduplicated)
  const addedDagreEdges = new Set<string>();
  for (const [childId, parents] of childToParents) {
    const coupleId = childToCouple.get(childId);
    if (coupleId) {
      const key = `${coupleId}>${childId}`;
      if (!addedDagreEdges.has(key)) {
        addedDagreEdges.add(key);
        g.setEdge(coupleId, childId);
      }
    } else {
      for (const parentId of parents) {
        const key = `${parentId}>${childId}`;
        if (!addedDagreEdges.has(key)) {
          addedDagreEdges.add(key);
          g.setEdge(parentId, childId);
        }
      }
    }
  }

  // ── Sibling chain edges ────────────────────────────────────────────────────
  // Group children by their shared couple node, sort by birth_date,
  // then link consecutive siblings with minlen:0 edges so Dagre keeps them
  // in the same rank and adjacent (prevents siblings from being scattered).
  const personById = new Map(persons.map((p) => [p.id, p]));
  const coupleChildren = new Map<string, string[]>();
  for (const [childId, coupleId] of childToCouple) {
    if (!coupleId) continue;
    if (!coupleChildren.has(coupleId)) coupleChildren.set(coupleId, []);
    coupleChildren.get(coupleId)!.push(childId);
  }
  for (const [, siblings] of coupleChildren) {
    if (siblings.length < 2) continue;
    siblings.sort((a, b) => {
      const da = personById.get(a)?.birth_date;
      const db = personById.get(b)?.birth_date;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da < db ? -1 : 1;
    });
    for (let i = 0; i < siblings.length - 1; i++) {
      g.setEdge(siblings[i], siblings[i + 1], { weight: 2, minlen: 0 });
    }
  }

  dagre.layout(g);

  // ── 5. Convert to React Flow nodes ────────────────────────────────────────
  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  for (const person of persons) {
    const n = g.node(person.id);
    if (!n) continue;
    rfNodes.push({
      id: person.id,
      type: "personNode",
      position: { x: n.x - PERSON_W / 2, y: n.y - PERSON_H / 2 },
      data: person as unknown as Record<string, unknown>,
    });
  }

  for (const [coupleId, c] of coupleMap) {
    const n = g.node(coupleId);
    if (!n) continue;
    rfNodes.push({
      id: coupleId,
      type: "coupleNode",
      position: { x: n.x - COUPLE_SIZE / 2, y: n.y - COUPLE_SIZE / 2 },
      data: { coupleType: c.coupleType } satisfies CoupleNodeData,
    });
  }

  // ── 6. Convert to React Flow edges ────────────────────────────────────────

  // Spouse edges (person → couple node)
  for (const [coupleId, c] of coupleMap) {
    rfEdges.push(
      makeEdge(`se_a_${coupleId}`, c.personA, coupleId, c.coupleType),
      makeEdge(`se_b_${coupleId}`, c.personB, coupleId, c.coupleType)
    );
  }

  // Parent-child edges (couple node → child, or single parent → child)
  const addedRfEdges = new Set<string>();
  for (const rel of parentChildRels) {
    const childId = rel.person_b_id;
    const coupleId = childToCouple.get(childId);
    const source = coupleId ?? rel.person_a_id;
    const key = `${source}>${childId}`;
    if (!addedRfEdges.has(key)) {
      addedRfEdges.add(key);
      rfEdges.push(makeEdge(`pc_${rel.id}`, source, childId, "parent_child"));
    }
  }

  // Sibling edges
  for (const rel of siblingRels) {
    rfEdges.push(
      makeEdge(`sib_${rel.id}`, rel.person_a_id, rel.person_b_id, "sibling")
    );
  }

  return { nodes: rfNodes, edges: rfEdges };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  relType: string
): Edge {
  return {
    id,
    source,
    target,
    type: "relationshipEdge",
    data: { relType },
  };
}
