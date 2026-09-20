import { createContext } from 'react';
export const Store050Context = createContext();
export function Store050Provider({ children }) {
  return <Store050Context.Provider value={{}}>{children}</Store050Context.Provider>;
}
