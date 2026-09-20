import { createContext } from 'react';
export const Store011Context = createContext();
export function Store011Provider({ children }) {
  return <Store011Context.Provider value={{}}>{children}</Store011Context.Provider>;
}
