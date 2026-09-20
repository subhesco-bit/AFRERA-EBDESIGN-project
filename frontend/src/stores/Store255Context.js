import { createContext } from 'react';
export const Store255Context = createContext();
export function Store255Provider({ children }) {
  return <Store255Context.Provider value={{}}>{children}</Store255Context.Provider>;
}
