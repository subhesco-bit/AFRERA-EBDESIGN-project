import { createContext } from 'react';
export const Store314Context = createContext();
export function Store314Provider({ children }) {
  return <Store314Context.Provider value={{}}>{children}</Store314Context.Provider>;
}
