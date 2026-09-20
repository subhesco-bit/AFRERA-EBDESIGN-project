import { createContext } from 'react';
export const Store093Context = createContext();
export function Store093Provider({ children }) {
  return <Store093Context.Provider value={{}}>{children}</Store093Context.Provider>;
}
