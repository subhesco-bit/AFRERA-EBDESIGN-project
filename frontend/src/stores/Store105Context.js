import { createContext } from 'react';
export const Store105Context = createContext();
export function Store105Provider({ children }) {
  return <Store105Context.Provider value={{}}>{children}</Store105Context.Provider>;
}
