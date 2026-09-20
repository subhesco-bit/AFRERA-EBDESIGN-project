import { createContext } from 'react';
export const Store190Context = createContext();
export function Store190Provider({ children }) {
  return <Store190Context.Provider value={{}}>{children}</Store190Context.Provider>;
}
