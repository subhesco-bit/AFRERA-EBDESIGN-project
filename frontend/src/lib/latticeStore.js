import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Client-side lattice UI state (selection, filters, local proposal drafts).
 * Ported from pine-shadow src/lib/lattice/store.ts — framework-agnostic
 * Zustand state, no server-function coupling, so unlike erp/store.ts and
 * modules/store.ts (which call TanStack Start server functions this
 * project doesn't use) this one ports 1:1.
 */
export const useLattice = create()(
  persist(
    (set, get) => ({
      selectedConceptId: 'farmer',
      selectedBridgeId: null,
      statusFilter: 'all',
      kindFilter: 'all',
      roleFilter: 'all',
      query: '',
      proposed: [],
      showMesh: true,
      selectConcept: (id) =>
        set({
          selectedConceptId: id,
          selectedBridgeId: id ? get().selectedBridgeId : null,
        }),
      selectBridge: (id) => set({ selectedBridgeId: id }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setKindFilter: (kindFilter) => set({ kindFilter }),
      setRoleFilter: (roleFilter) => set({ roleFilter }),
      setQuery: (query) => set({ query }),
      toggleProposed: (id) => {
        const cur = get().proposed;
        set({
          proposed: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },
      setShowMesh: (showMesh) => set({ showMesh }),
    }),
    { name: 'afrera-lattice', partialize: (s) => ({ proposed: s.proposed, showMesh: s.showMesh }) },
  ),
);
