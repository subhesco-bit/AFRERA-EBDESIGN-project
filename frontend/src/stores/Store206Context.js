import { createContext } from 'react';
export const Store206Context = createContext();
export function Store206Provider({ children }) {
  return <Store206Context.Provider value={{}}>{children}</Store206Context.Provider>;
}
