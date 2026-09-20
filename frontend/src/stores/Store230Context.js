import { createContext } from 'react';
export const Store230Context = createContext();
export function Store230Provider({ children }) {
  return <Store230Context.Provider value={{}}>{children}</Store230Context.Provider>;
}
