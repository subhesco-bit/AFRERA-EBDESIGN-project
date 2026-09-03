# COMP-040: CodeBlock

**Phase:** 6.1 (Atomic Components)  
**Component:** CodeBlock  
**Priority**: P0 - Critical  
**Status**: Specification Complete  

## Component Specification

### Purpose
Reusable code block component for code display with syntax highlighting.

### Props
- `code` (string)
- `language` (string)
- `showLineNumbers` (boolean)
- `copyable` (boolean)
- `theme` (string)

### Features
- Syntax highlighting
- Line numbers
- Copy to clipboard
- Language detection
- Custom themes
- Word wrap

### Accessibility
- ARIA attributes
- Screen reader support
- Code reading
- Copy feedback

### Dependencies
- React
- TailwindCSS
- Prism.js or Shiki

---

*Generated for Phase 6.1 Atomic Components Implementation*