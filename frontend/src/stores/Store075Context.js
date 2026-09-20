import { createContext } from 'react';
export const Store075Context = createContext();
export function Store075Provider({ children }) {
  return <Store075Context.Provider value={{}}>{children}</Store075Context.Provider>;
}
