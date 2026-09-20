import { createContext } from 'react';
export const Store127Context = createContext();
export function Store127Provider({ children }) {
  return <Store127Context.Provider value={{}}>{children}</Store127Context.Provider>;
}
