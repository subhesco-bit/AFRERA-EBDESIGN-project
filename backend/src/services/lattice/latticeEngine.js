/**
 * Lattice Engine - Graph/Network Theory for Domain Concepts
 *
 * Maps domain concepts as interconnected nodes with bridges (relationships).
 * Used for: farmer networks, supply chain tracing, product recommendations,
 * knowledge graph traversal.
 *
 * From pine-shadow: bridges-core + bridges-mesh
 */

'use strict';

class LatticeEngine {
  constructor() {
    this.nodes = new Map();      // conceptId → concept
    this.bridges = new Map();    // bridgeId → bridge
    this.adjacency = new Map();  // conceptId → [targetIds]
    this.cache = new Map();      // query cache
  }

  /**
   * Register a concept node in the lattice
   */
  registerConcept(conceptId, concept) {
    if (!conceptId || !concept) {
      throw new Error('conceptId and concept required');
    }
    this.nodes.set(conceptId, {
      id: conceptId,
      type: concept.type, // 'farmer', 'product', 'market', 'process'
      data: concept.data,
      metadata: concept.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (!this.adjacency.has(conceptId)) {
      this.adjacency.set(conceptId, []);
    }
    this.cache.clear();
    return this.nodes.get(conceptId);
  }

  /**
   * Create a bridge (relationship) between two concepts
   */
  createBridge(bridgeId, sourceId, targetId, bridgeType, metadata = {}) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      throw new Error(`Source or target concept not found`);
    }

    this.bridges.set(bridgeId, {
      id: bridgeId,
      source: sourceId,
      target: targetId,
      type: bridgeType, // 'supplies', 'located_in', 'owns', 'produces'
      weight: metadata.weight || 1.0,
      metadata,
      createdAt: new Date(),
    });

    if (!this.adjacency.has(sourceId)) {
      this.adjacency.set(sourceId, []);
    }
    this.adjacency.get(sourceId).push(targetId);
    this.cache.clear();
    return this.bridges.get(bridgeId);
  }

  /**
   * Walk the lattice from a starting node
   * Returns all reachable nodes and the paths to reach them
   */
  walk(startConceptId, maxDepth = 5) {
    if (!this.nodes.has(startConceptId)) {
      throw new Error(`Concept ${startConceptId} not found`);
    }

    const visited = new Map(); // conceptId → {distance, path}
    const queue = [{id: startConceptId, distance: 0, path: [startConceptId]}];
    visited.set(startConceptId, {distance: 0, path: [startConceptId]});

    while (queue.length > 0) {
      const {id, distance, path} = queue.shift();

      if (distance >= maxDepth) continue;

      const neighbors = this.adjacency.get(id) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          const newPath = [...path, neighborId];
          visited.set(neighborId, {distance: distance + 1, path: newPath});
          queue.push({id: neighborId, distance: distance + 1, path: newPath});
        }
      }
    }

    return {
      advisory: true,
      startNode: this.nodes.get(startConceptId),
      reachable: Array.from(visited.entries()).map(([id, info]) => ({
        id,
        concept: this.nodes.get(id),
        distance: info.distance,
        path: info.path.map(cid => this.nodes.get(cid)),
      })),
      basis: 'BFS graph traversal from starting concept',
    };
  }

  /**
   * Find shortest path between two concepts
   */
  shortestPath(startId, endId) {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      throw new Error('Start or end concept not found');
    }

    const visited = new Set();
    const queue = [{id: startId, path: [startId]}];
    visited.add(startId);

    while (queue.length > 0) {
      const {id, path} = queue.shift();

      if (id === endId) {
        return {
          found: true,
          path: path.map(cid => this.nodes.get(cid)),
          distance: path.length - 1,
          advisory: true,
          basis: 'BFS shortest path',
        };
      }

      const neighbors = this.adjacency.get(id) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({id: neighborId, path: [...path, neighborId]});
        }
      }
    }

    return {
      found: false,
      advisory: true,
      reason: `No path exists from ${startId} to ${endId}`,
    };
  }

  /**
   * Get all neighbors of a concept (one bridge away)
   */
  getNeighbors(conceptId) {
    if (!this.nodes.has(conceptId)) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    const neighborIds = this.adjacency.get(conceptId) || [];
    return {
      advisory: true,
      concept: this.nodes.get(conceptId),
      neighbors: neighborIds.map(id => ({
        id,
        concept: this.nodes.get(id),
        bridges: this.bridges._getEdges(conceptId, id),
      })),
      count: neighborIds.length,
    };
  }

  /**
   * Get all bridges between two specific concepts
   */
  _getEdges(sourceId, targetId) {
    const edges = [];
    for (const bridge of this.bridges.values()) {
      if (bridge.source === sourceId && bridge.target === targetId) {
        edges.push(bridge);
      }
    }
    return edges;
  }

  /**
   * Query concepts by type
   */
  queryByType(conceptType) {
    const results = [];
    for (const concept of this.nodes.values()) {
      if (concept.type === conceptType) {
        results.push(concept);
      }
    }
    return {
      advisory: true,
      type: conceptType,
      results,
      count: results.length,
    };
  }

  /**
   * Mesh analysis: find clusters of connected concepts
   */
  analyzeMesh() {
    const clusters = [];
    const visited = new Set();

    for (const nodeId of this.nodes.keys()) {
      if (visited.has(nodeId)) continue;

      const cluster = [];
      const queue = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const id = queue.shift();
        cluster.push(id);

        const neighbors = this.adjacency.get(id) || [];
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        }
      }

      clusters.push({
        size: cluster.length,
        nodes: cluster.map(id => this.nodes.get(id)),
      });
    }

    return {
      advisory: true,
      clusters,
      totalClusters: clusters.length,
      averageClusterSize: clusters.reduce((sum, c) => sum + c.size, 0) / clusters.length,
      basis: 'Connected components analysis (DFS)',
    };
  }

  /**
   * Get lattice statistics
   */
  getStats() {
    return {
      advisory: true,
      nodes: this.nodes.size,
      bridges: this.bridges.size,
      averageDegree: this.adjacency.size === 0 ? 0 :
        Array.from(this.adjacency.values()).reduce((sum, neighbors) => sum + neighbors.length, 0) / this.adjacency.size,
      cacheSize: this.cache.size,
    };
  }
}

module.exports = { LatticeEngine };
