import { createContext } from 'react';
export const Store181Context = createContext();
export function Store181Provider({ children }) {
  return <Store181Context.Provider value={{}}>{children}</Store181Context.Provider>;
}
