import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { Person, Relationship } from "@/lib/types";

const PERSON_W = 168;
const PERSON_H = 80;
const COUPLE_SIZE = 8;
const NODE_SEP = 60;
const RANK_SEP = 100;
// x-spacing between nodes in the same generation
const INTRA_COUPLE_GAP = 16;      // gap between two spouses in a couple unit
const INTER_UNIT_GAP = NODE_SEP;  // gap between couple units within same family
const INTER_FAMILY_GAP = NODE_SEP * 2; // gap between different family groups

export type PersonNodeData = Person & { type: "personNode" };
export type CoupleNodeData = { coupleType: "spouse" | "ex_spouse" };

// ─── Main export ─────────────────────────────────────────────────────────────

export function buildTreeLayout(
  persons: Person[],
  relationships: Relationship[],
  customOrder?: Map<string, number> // personId → x_order rank within generation
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
  const childToParents = new Map<string, string[]>();
  for (const rel of parentChildRels) {
    const arr = childToParents.get(rel.person_b_id) ?? [];
    arr.push(rel.person_a_id);
    childToParents.set(rel.person_b_id, arr);
  }

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

  for (const [coupleId, c] of coupleMap) {
    g.setEdge(c.personA, coupleId, { weight: 2 });
    g.setEdge(c.personB, coupleId, { weight: 2 });
  }

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

  dagre.layout(g);

  // ── 5. Post-process: order nodes within each generation ───────────────────
  {
    const personById = new Map(persons.map((p) => [p.id, p]));

    // personId → spouse personId (only direct couples)
    const personToSpouse = new Map<string, string>();
    for (const [, c] of coupleMap) {
      personToSpouse.set(c.personA, c.personB);
      personToSpouse.set(c.personB, c.personA);
    }

    // Group persons by Dagre y-position (generation)
    const byGen = new Map<number, string[]>();
    for (const person of persons) {
      const n = g.node(person.id);
      if (!n) continue;
      const y = Math.round(n.y);
      if (!byGen.has(y)) byGen.set(y, []);
      byGen.get(y)!.push(person.id);
    }

    const sortedGens = [...byGen.keys()].sort((a, b) => a - b);

    for (const genY of sortedGens) {
      const ids = byGen.get(genY)!;
      const idsSet = new Set(ids);
      const placed = new Set<string>();

      type Slot = { ids: string[]; familyGroup: string | null };

      const sortKey = (pid: string): string => {
        const p = personById.get(pid);
        return `${p?.birth_date ?? "9999-99-99"}_${p?.full_name ?? ""}`;
      };

      // Build a couple unit: husband (male) on left, wife (female) on right
      const makeSlot = (pid: string): Slot => {
        const spouseId = personToSpouse.get(pid);
        const fg = childToCouple.get(pid) ?? null;
        if (spouseId && idsSet.has(spouseId) && !placed.has(spouseId)) {
          const p = personById.get(pid);
          const sp = personById.get(spouseId);
          let left = pid,
            right = spouseId;
          if (p?.gender === "female" && sp?.gender === "male") {
            left = spouseId;
            right = pid;
          }
          placed.add(pid);
          placed.add(spouseId);
          const spouseFg = childToCouple.get(spouseId) ?? null;
          return { ids: [left, right], familyGroup: fg ?? spouseFg };
        }
        placed.add(pid);
        return { ids: [pid], familyGroup: fg };
      };

      const slots: Slot[] = [];

      if (customOrder && ids.some((id) => customOrder.has(id))) {
        // Use saved custom ordering; couple units still kept together
        const sorted = [...ids].sort((a, b) => {
          const oa = customOrder.get(a) ?? 99999;
          const ob = customOrder.get(b) ?? 99999;
          return oa !== ob ? oa - ob : sortKey(a).localeCompare(sortKey(b));
        });
        for (const id of sorted) {
          if (!placed.has(id)) slots.push(makeSlot(id));
        }
      } else {
        // Automatic ordering: group by parent family, left-to-right by parent x
        const familiesPresent = new Set<string>();
        for (const id of ids) {
          const fg = childToCouple.get(id);
          if (fg) familiesPresent.add(fg);
        }
        const sortedFamilies = [...familiesPresent].sort(
          (a, b) => (g.node(a)?.x ?? 0) - (g.node(b)?.x ?? 0)
        );

        for (const fg of sortedFamilies) {
          const children = ids
            .filter((id) => !placed.has(id) && childToCouple.get(id) === fg)
            .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
          for (const id of children) {
            if (!placed.has(id)) slots.push(makeSlot(id));
          }
        }

        // Remaining: roots, singles, cross-family spouses not yet placed
        const remaining = ids
          .filter((id) => !placed.has(id))
          .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
        for (const id of remaining) {
          if (!placed.has(id)) slots.push(makeSlot(id));
        }
      }

      // Assign x-positions left-to-right then center the row
      let x = 0;
      const positions: Array<{ id: string; cx: number }> = [];

      for (let si = 0; si < slots.length; si++) {
        const slot = slots[si];
        for (let pi = 0; pi < slot.ids.length; pi++) {
          positions.push({ id: slot.ids[pi], cx: x });
          if (pi < slot.ids.length - 1) {
            x += PERSON_W + INTRA_COUPLE_GAP;
          }
        }
        if (si < slots.length - 1) {
          const sameFamily =
            slot.familyGroup !== null &&
            slot.familyGroup === slots[si + 1].familyGroup;
          x += sameFamily
            ? PERSON_W + INTER_UNIT_GAP
            : PERSON_W + INTER_FAMILY_GAP;
        }
      }

      // Center row: x is the last slot's left edge; total width = x + PERSON_W
      const offset = -(x + PERSON_W) / 2 + PERSON_W / 2;
      for (const { id, cx } of positions) {
        const node = g.node(id);
        if (node) node.x = cx + offset;
      }

      // Move couple nodes to midpoint of their two spouses in this generation
      for (const [coupleId, c] of coupleMap) {
        const nA = g.node(c.personA);
        const nB = g.node(c.personB);
        if (!nA || !nB) continue;
        if (Math.round(nA.y) !== genY || Math.round(nB.y) !== genY) continue;
        const cn = g.node(coupleId);
        if (cn) cn.x = (nA.x + nB.x) / 2;
      }
    }
  }

  // ── 6. Convert to React Flow nodes ────────────────────────────────────────
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

  // ── 7. Convert to React Flow edges ────────────────────────────────────────

  for (const [coupleId, c] of coupleMap) {
    rfEdges.push(
      makeEdge(`se_a_${coupleId}`, c.personA, coupleId, c.coupleType),
      makeEdge(`se_b_${coupleId}`, c.personB, coupleId, c.coupleType)
    );
  }

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
