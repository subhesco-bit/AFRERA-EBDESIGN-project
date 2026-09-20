import { createContext } from 'react';
export const Store123Context = createContext();
export function Store123Provider({ children }) {
  return <Store123Context.Provider value={{}}>{children}</Store123Context.Provider>;
}
