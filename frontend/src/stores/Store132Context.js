import { createContext } from 'react';
export const Store132Context = createContext();
export function Store132Provider({ children }) {
  return <Store132Context.Provider value={{}}>{children}</Store132Context.Provider>;
}
