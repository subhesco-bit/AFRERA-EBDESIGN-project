import { createContext } from 'react';
export const Store302Context = createContext();
export function Store302Provider({ children }) {
  return <Store302Context.Provider value={{}}>{children}</Store302Context.Provider>;
}
