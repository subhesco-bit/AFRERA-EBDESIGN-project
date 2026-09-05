# COMP-022: Textarea

**Phase:** 6.1 (Atomic Components)  
**Component:** Textarea  
**Priority**: P0 - Critical  
**Status:** Specification Complete  

## Component Specification

### Purpose
Reusable textarea component with validation and character count.

### Props
- `value` (string)
- `onChange` (function)
- `placeholder` (string)
- `rows` (number)
- `maxLength` (number)
- `disabled` (boolean)
- `error` (string)
- `label` (string)
- `showCount` (boolean)

### Features
- Character count
- Auto-resize
- Validation
- Error display
- Label support
- Helper text

### Accessibility
- ARIA attributes
- Error announcements
- Character count announcement
- Keyboard navigation

### Dependencies
- React
- TailwindCSS
- Radix UI

---

*Generated for Phase 6.1 Atomic Components Implementation*