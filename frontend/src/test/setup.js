import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Optional global setup for testing-library or mocks
globalThis.IS_REACT_ACT_ENVIRONMENT = true
globalThis.jest = vi
