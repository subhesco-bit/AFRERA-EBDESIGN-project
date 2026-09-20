import { createContext } from 'react';
export const Store095Context = createContext();
export function Store095Provider({ children }) {
  return <Store095Context.Provider value={{}}>{children}</Store095Context.Provider>;
}
