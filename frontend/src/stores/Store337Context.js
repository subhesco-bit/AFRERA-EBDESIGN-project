import { createContext } from 'react';
export const Store337Context = createContext();
export function Store337Provider({ children }) {
  return <Store337Context.Provider value={{}}>{children}</Store337Context.Provider>;
}
