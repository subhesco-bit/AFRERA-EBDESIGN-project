# COMP-042: ConfirmDialog

**Phase:** 6.1 (Atomic Components)  
**Component:** ConfirmDialog  
**Priority**: P0 - Critical  
**Status:** Specification Complete  

## Component Specification

### Purpose
Reusable confirmation dialog for destructive actions.

### Props
- `isOpen` (boolean)
- `onClose` (function)
- `onConfirm` (function)
- `title` (string)
- `message` (string)
- `confirmText` (string)
- `cancelText` (string)
- `variant` (danger, warning, info)

### Features
- Confirmation message
- Custom button text
- Variant options
- Icon support
- Keyboard shortcuts
- Animation

### Accessibility
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management

### Dependencies
- React
- TailwindCSS
- Radix UI

---

*Generated for Phase 6.1 Atomic Components Implementation*