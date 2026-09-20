import { createContext } from 'react';
export const Store025Context = createContext();
export function Store025Provider({ children }) {
  return <Store025Context.Provider value={{}}>{children}</Store025Context.Provider>;
}
