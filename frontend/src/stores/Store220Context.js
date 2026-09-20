import { createContext } from 'react';
export const Store220Context = createContext();
export function Store220Provider({ children }) {
  return <Store220Context.Provider value={{}}>{children}</Store220Context.Provider>;
}
