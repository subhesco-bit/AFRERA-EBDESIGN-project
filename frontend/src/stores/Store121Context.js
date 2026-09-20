import { createContext } from 'react';
export const Store121Context = createContext();
export function Store121Provider({ children }) {
  return <Store121Context.Provider value={{}}>{children}</Store121Context.Provider>;
}
