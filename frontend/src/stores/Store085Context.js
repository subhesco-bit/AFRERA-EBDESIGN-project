import { createContext } from 'react';
export const Store085Context = createContext();
export function Store085Provider({ children }) {
  return <Store085Context.Provider value={{}}>{children}</Store085Context.Provider>;
}
