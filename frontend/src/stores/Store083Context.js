import { createContext } from 'react';
export const Store083Context = createContext();
export function Store083Provider({ children }) {
  return <Store083Context.Provider value={{}}>{children}</Store083Context.Provider>;
}
