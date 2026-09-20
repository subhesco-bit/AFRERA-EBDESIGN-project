import { createContext } from 'react';
export const Store130Context = createContext();
export function Store130Provider({ children }) {
  return <Store130Context.Provider value={{}}>{children}</Store130Context.Provider>;
}
