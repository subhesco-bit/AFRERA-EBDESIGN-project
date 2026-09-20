import { createContext } from 'react';
export const Store210Context = createContext();
export function Store210Provider({ children }) {
  return <Store210Context.Provider value={{}}>{children}</Store210Context.Provider>;
}
