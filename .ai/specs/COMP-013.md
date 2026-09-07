# COMP-013: Pagination

**Phase:** 6.1 (Atomic Components)  
**Component:** Pagination  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Component Specification

### Purpose
Reusable pagination component for paginated content.

### Props
- `currentPage` (number)
- `totalPages` (number)
- `onPageChange` (function)
- `showFirstLast` (boolean)
- `showPrevNext` (boolean)
- `boundaryCount` (number)

### Features
- Page navigation
- First/last buttons
- Prev/next buttons
- Ellipsis for large page counts
- Custom styling
- Disabled states

### Accessibility
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Current page indication

### Dependencies
- React
- TailwindCSS
- Radix UI

---

*Generated for Phase 6.1 Atomic Components Implementation*