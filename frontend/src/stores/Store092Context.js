import { createContext } from 'react';
export const Store092Context = createContext();
export function Store092Provider({ children }) {
  return <Store092Context.Provider value={{}}>{children}</Store092Context.Provider>;
}
