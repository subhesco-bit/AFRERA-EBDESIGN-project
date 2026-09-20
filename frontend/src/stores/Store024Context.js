import { createContext } from 'react';
export const Store024Context = createContext();
export function Store024Provider({ children }) {
  return <Store024Context.Provider value={{}}>{children}</Store024Context.Provider>;
}
