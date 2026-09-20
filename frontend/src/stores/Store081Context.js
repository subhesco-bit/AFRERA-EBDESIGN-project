import { createContext } from 'react';
export const Store081Context = createContext();
export function Store081Provider({ children }) {
  return <Store081Context.Provider value={{}}>{children}</Store081Context.Provider>;
}
