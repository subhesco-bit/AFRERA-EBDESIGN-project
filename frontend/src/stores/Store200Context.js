import { createContext } from 'react';
export const Store200Context = createContext();
export function Store200Provider({ children }) {
  return <Store200Context.Provider value={{}}>{children}</Store200Context.Provider>;
}
