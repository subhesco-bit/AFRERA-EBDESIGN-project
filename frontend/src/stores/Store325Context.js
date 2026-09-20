import { createContext } from 'react';
export const Store325Context = createContext();
export function Store325Provider({ children }) {
  return <Store325Context.Provider value={{}}>{children}</Store325Context.Provider>;
}
