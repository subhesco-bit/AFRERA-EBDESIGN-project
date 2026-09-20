import { createContext } from 'react';
export const Store035Context = createContext();
export function Store035Provider({ children }) {
  return <Store035Context.Provider value={{}}>{children}</Store035Context.Provider>;
}
