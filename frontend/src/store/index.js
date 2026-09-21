// Barrel file for '@/store'. Did not exist before (only authStore.js was
// present in this directory), which broke every one of the ~300 generated
// module pages that do `import { useStore } from '@/store'` — there is no
// separate generic app store; useAuthStore already provides the `user` field
// (and auth state) those pages destructure, so it is re-exported under the
// name they expect rather than fabricating a second, redundant store.
export { useAuthStore as useStore, useAuthStore, demoAccounts } from './authStore';
