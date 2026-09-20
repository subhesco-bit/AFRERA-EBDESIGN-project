import { createContext } from 'react';
export const Store311Context = createContext();
export function Store311Provider({ children }) {
  return <Store311Context.Provider value={{}}>{children}</Store311Context.Provider>;
}
