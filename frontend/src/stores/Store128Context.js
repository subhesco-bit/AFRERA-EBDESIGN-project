import { createContext } from 'react';
export const Store128Context = createContext();
export function Store128Provider({ children }) {
  return <Store128Context.Provider value={{}}>{children}</Store128Context.Provider>;
}
