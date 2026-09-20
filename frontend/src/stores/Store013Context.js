import { createContext } from 'react';
export const Store013Context = createContext();
export function Store013Provider({ children }) {
  return <Store013Context.Provider value={{}}>{children}</Store013Context.Provider>;
}
