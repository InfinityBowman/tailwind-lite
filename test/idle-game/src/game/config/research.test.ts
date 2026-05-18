import { describe, it, expect } from 'vitest';
import {
  RESEARCH_NODES,
  ALL_RESEARCH_IDS,
  MAX_RESEARCH_TIER,
  getResearchByTier,
  type ResearchEffectType,
} from './research';

describe('Research Config', () => {
  describe('No NaN or Infinity values', () => {
    it('all research nodes have finite cost values', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(Number.isFinite(node.costs.refinedEssence), `${key}.costs.refinedEssence`).toBe(
          true
        );
        if (node.costs.crystals !== undefined) {
          expect(Number.isFinite(node.costs.crystals), `${key}.costs.crystals`).toBe(true);
        }
      }
    });

    it('all research effects have finite values', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          expect(Number.isFinite(effect.value), `${key}.effects.${effect.type}.value`).toBe(true);
        }
      }
    });

    it('all research tiers are finite', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(Number.isFinite(node.tier), `${key}.tier`).toBe(true);
      }
    });
  });

  describe('All costs are positive', () => {
    it('all refined essence costs are positive', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(node.costs.refinedEssence, `${key}.costs.refinedEssence`).toBeGreaterThan(0);
      }
    });

    it('all crystal costs (when present) are positive', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        if (node.costs.crystals !== undefined) {
          expect(node.costs.crystals, `${key}.costs.crystals`).toBeGreaterThan(0);
        }
      }
    });

    it('all effect values are positive', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          expect(effect.value, `${key}.effects.${effect.type}.value`).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('All research nodes have valid structure', () => {
    it('all nodes have matching id and key', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(node.id, `${key}.id`).toBe(key);
      }
    });

    it('all nodes have non-empty names', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(typeof node.name).toBe('string');
        expect(node.name.length, `${key}.name`).toBeGreaterThan(0);
      }
    });

    it('all nodes have non-empty descriptions', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(typeof node.description).toBe('string');
        expect(node.description.length, `${key}.description`).toBeGreaterThan(0);
      }
    });

    it('all nodes have non-empty icon names', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(typeof node.icon).toBe('string');
        expect(node.icon.length, `${key}.icon`).toBeGreaterThan(0);
      }
    });

    it('all nodes have at least one effect', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(node.effects.length, `${key}.effects`).toBeGreaterThan(0);
      }
    });

    it('all nodes have valid tier values', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(node.tier, `${key}.tier`).toBeGreaterThanOrEqual(1);
        expect(node.tier, `${key}.tier`).toBeLessThanOrEqual(MAX_RESEARCH_TIER);
      }
    });

    it('all effects have valid effect types', () => {
      const validEffects: ResearchEffectType[] = [
        'AUTO_SELL',
        'PRODUCTION_BOOST',
        'STORAGE_BOOST',
        'GACHA_DISCOUNT',
        'FUSION_DISCOUNT',
        'OFFLINE_BOOST',
        'RESOURCE_INSIGHT',
        'EXPORT_SPEED_BOOST',
        'REFINE_EFFICIENCY',
        'EXTRACT_EFFICIENCY',
        'MULTI_PULL',
        'AUTO_FUSE',
        'UNLOCK_MANAGERS',
      ];
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          expect(validEffects, `${key}.effects.${effect.type}`).toContain(effect.type);
        }
      }
    });

    it('prerequisites is always an array', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(Array.isArray(node.prerequisites), `${key}.prerequisites`).toBe(true);
      }
    });
  });

  describe('Prerequisites reference valid nodes', () => {
    it('all prerequisite IDs exist in RESEARCH_NODES', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        for (const prereqId of node.prerequisites) {
          expect(RESEARCH_NODES[prereqId], `${key} -> ${prereqId}`).toBeDefined();
        }
      }
    });

    it('tier 1 nodes have no prerequisites', () => {
      const tier1Nodes = getResearchByTier(1);
      for (const node of tier1Nodes) {
        expect(node.prerequisites.length, `${node.id} (tier 1) should have no prerequisites`).toBe(
          0
        );
      }
    });

    it('prerequisites are from same or lower tier', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        for (const prereqId of node.prerequisites) {
          const prereqNode = RESEARCH_NODES[prereqId];
          expect(
            prereqNode.tier,
            `${key} (tier ${node.tier}) prerequisite ${prereqId} (tier ${prereqNode.tier})`
          ).toBeLessThanOrEqual(node.tier);
        }
      }
    });

    it('same-tier chains are eventually rooted in lower tiers', () => {
      // Ensure that even same-tier prerequisite chains eventually lead to lower tiers
      function getRootTier(nodeId: string, visited: Set<string> = new Set()): number {
        if (visited.has(nodeId)) return Infinity; // Circular (caught by other test)
        visited.add(nodeId);

        const node = RESEARCH_NODES[nodeId];
        if (node.prerequisites.length === 0) return node.tier;

        let minRootTier = Infinity;
        for (const prereqId of node.prerequisites) {
          const rootTier = getRootTier(prereqId, new Set(visited));
          minRootTier = Math.min(minRootTier, rootTier);
        }
        return minRootTier;
      }

      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        if (node.tier > 1) {
          const rootTier = getRootTier(key);
          expect(rootTier, `${key} should be rooted in tier 1`).toBe(1);
        }
      }
    });
  });

  describe('No circular dependencies', () => {
    it('no node is its own prerequisite', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(node.prerequisites).not.toContain(key);
      }
    });

    it('no circular dependency chains exist', () => {
      // For each node, traverse its prerequisite tree and ensure no cycles
      function hasCircularDependency(nodeId: string, visited: Set<string> = new Set()): boolean {
        if (visited.has(nodeId)) {
          return true;
        }
        visited.add(nodeId);

        const node = RESEARCH_NODES[nodeId];
        if (!node) return false;

        for (const prereqId of node.prerequisites) {
          if (hasCircularDependency(prereqId, new Set(visited))) {
            return true;
          }
        }
        return false;
      }

      for (const nodeId of ALL_RESEARCH_IDS) {
        expect(hasCircularDependency(nodeId), `Circular dependency detected from ${nodeId}`).toBe(
          false
        );
      }
    });

    it('all nodes are reachable from tier 1', () => {
      // Build a set of reachable nodes starting from tier 1
      const tier1Ids = getResearchByTier(1).map(n => n.id);
      const reachable = new Set<string>(tier1Ids);
      let added = true;

      while (added) {
        added = false;
        for (const [key, node] of Object.entries(RESEARCH_NODES)) {
          if (reachable.has(key)) continue;

          // A node is reachable if all its prerequisites are reachable
          const allPrereqsReachable = node.prerequisites.every(p => reachable.has(p));
          if (allPrereqsReachable) {
            reachable.add(key);
            added = true;
          }
        }
      }

      // All nodes should be reachable
      for (const nodeId of ALL_RESEARCH_IDS) {
        expect(reachable.has(nodeId), `${nodeId} should be reachable from tier 1`).toBe(true);
      }
    });
  });

  describe('Bonus values are reasonable', () => {
    it('percentage-based boosts are between 0 and 1', () => {
      const percentageEffects: ResearchEffectType[] = [
        'PRODUCTION_BOOST',
        'STORAGE_BOOST',
        'GACHA_DISCOUNT',
        'FUSION_DISCOUNT',
        'OFFLINE_BOOST',
        'EXPORT_SPEED_BOOST',
        'REFINE_EFFICIENCY',
        'EXTRACT_EFFICIENCY',
      ];

      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          if (percentageEffects.includes(effect.type)) {
            expect(effect.value, `${key}.${effect.type}`).toBeGreaterThan(0);
            expect(effect.value, `${key}.${effect.type}`).toBeLessThanOrEqual(1);
          }
        }
      }
    });

    it('unlock effects have value of 1', () => {
      const unlockEffects: ResearchEffectType[] = [
        'AUTO_SELL',
        'RESOURCE_INSIGHT',
        'MULTI_PULL',
        'AUTO_FUSE',
        'UNLOCK_MANAGERS',
      ];

      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          if (unlockEffects.includes(effect.type)) {
            expect(effect.value, `${key}.${effect.type}`).toBe(1);
          }
        }
      }
    });
  });

  describe('Costs scale appropriately', () => {
    it('higher tier research costs more', () => {
      for (let tier = 2; tier <= MAX_RESEARCH_TIER; tier++) {
        const currentTierNodes = getResearchByTier(tier);
        const prevTierNodes = getResearchByTier(tier - 1);

        const currentTierMinCost = Math.min(...currentTierNodes.map(n => n.costs.refinedEssence));
        const prevTierMaxCost = Math.max(...prevTierNodes.map(n => n.costs.refinedEssence));

        // Higher tier minimum should be >= previous tier maximum
        expect(
          currentTierMinCost,
          `Tier ${tier} min cost should be >= tier ${tier - 1} max cost`
        ).toBeGreaterThanOrEqual(prevTierMaxCost);
      }
    });

    it('tier 1 research is affordable early game', () => {
      const tier1Nodes = getResearchByTier(1);
      for (const node of tier1Nodes) {
        expect(node.costs.refinedEssence, `${node.id} should be affordable`).toBeLessThanOrEqual(
          50
        );
      }
    });

    it('tier 4 research requires significant investment', () => {
      const tier4Nodes = getResearchByTier(4);
      for (const node of tier4Nodes) {
        expect(node.costs.refinedEssence, `${node.id} should be expensive`).toBeGreaterThanOrEqual(
          100
        );
      }
    });
  });

  describe('ALL_RESEARCH_IDS consistency', () => {
    it('ALL_RESEARCH_IDS matches RESEARCH_NODES keys', () => {
      const nodeKeys = Object.keys(RESEARCH_NODES);
      expect(ALL_RESEARCH_IDS.length).toBe(nodeKeys.length);
      for (const key of nodeKeys) {
        expect(ALL_RESEARCH_IDS).toContain(key);
      }
    });
  });

  describe('MAX_RESEARCH_TIER consistency', () => {
    it('MAX_RESEARCH_TIER matches highest tier in RESEARCH_NODES', () => {
      const maxTierInNodes = Math.max(...Object.values(RESEARCH_NODES).map(n => n.tier));
      expect(MAX_RESEARCH_TIER).toBe(maxTierInNodes);
    });

    it('all tiers from 1 to MAX_RESEARCH_TIER have at least one node', () => {
      for (let tier = 1; tier <= MAX_RESEARCH_TIER; tier++) {
        const nodes = getResearchByTier(tier);
        expect(nodes.length, `Tier ${tier} should have at least one node`).toBeGreaterThan(0);
      }
    });
  });

  describe('getResearchByTier function', () => {
    it('returns correct nodes for each tier', () => {
      for (let tier = 1; tier <= MAX_RESEARCH_TIER; tier++) {
        const nodes = getResearchByTier(tier);
        for (const node of nodes) {
          expect(node.tier).toBe(tier);
        }
      }
    });

    it('returns empty array for invalid tiers', () => {
      expect(getResearchByTier(0)).toHaveLength(0);
      expect(getResearchByTier(MAX_RESEARCH_TIER + 1)).toHaveLength(0);
      expect(getResearchByTier(-1)).toHaveLength(0);
    });

    it('total nodes across all tiers equals total research nodes', () => {
      let totalNodes = 0;
      for (let tier = 1; tier <= MAX_RESEARCH_TIER; tier++) {
        totalNodes += getResearchByTier(tier).length;
      }
      expect(totalNodes).toBe(ALL_RESEARCH_IDS.length);
    });
  });

  describe('Research tree balance', () => {
    it('no node has too many prerequisites (max 3)', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        expect(node.prerequisites.length, `${key} has too many prerequisites`).toBeLessThanOrEqual(
          3
        );
      }
    });

    it('every non-tier-1 node has at least one prerequisite', () => {
      for (const [key, node] of Object.entries(RESEARCH_NODES)) {
        if (node.tier > 1) {
          expect(
            node.prerequisites.length,
            `${key} (tier ${node.tier}) should have prerequisites`
          ).toBeGreaterThan(0);
        }
      }
    });

    it('combined production boosts do not exceed 200%', () => {
      let totalProductionBoost = 0;
      for (const node of Object.values(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          if (effect.type === 'PRODUCTION_BOOST') {
            totalProductionBoost += effect.value;
          }
        }
      }
      // Total from research should be meaningful but not game-breaking
      expect(totalProductionBoost).toBeLessThanOrEqual(2.0);
    });

    it('combined gacha discounts do not make pulls free', () => {
      let totalGachaDiscount = 0;
      for (const node of Object.values(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          if (effect.type === 'GACHA_DISCOUNT') {
            totalGachaDiscount += effect.value;
          }
        }
      }
      expect(totalGachaDiscount).toBeLessThan(1.0);
    });

    it('combined export speed boosts are reasonable', () => {
      let totalExportSpeedBoost = 0;
      for (const node of Object.values(RESEARCH_NODES)) {
        for (const effect of node.effects) {
          if (effect.type === 'EXPORT_SPEED_BOOST') {
            totalExportSpeedBoost += effect.value;
          }
        }
      }
      // Total export speed boost from research should be under 100%
      expect(totalExportSpeedBoost).toBeLessThan(1.0);
    });
  });
});
