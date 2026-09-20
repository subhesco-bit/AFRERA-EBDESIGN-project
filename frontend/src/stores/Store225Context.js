import { createContext } from 'react';
export const Store225Context = createContext();
export function Store225Provider({ children }) {
  return <Store225Context.Provider value={{}}>{children}</Store225Context.Provider>;
}
