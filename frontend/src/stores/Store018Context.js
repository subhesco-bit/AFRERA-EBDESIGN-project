import { createContext } from 'react';
export const Store018Context = createContext();
export function Store018Provider({ children }) {
  return <Store018Context.Provider value={{}}>{children}</Store018Context.Provider>;
}
