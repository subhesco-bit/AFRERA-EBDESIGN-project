import { createContext } from 'react';
export const Store012Context = createContext();
export function Store012Provider({ children }) {
  return <Store012Context.Provider value={{}}>{children}</Store012Context.Provider>;
}
