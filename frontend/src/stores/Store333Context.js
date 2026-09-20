import { createContext } from 'react';
export const Store333Context = createContext();
export function Store333Provider({ children }) {
  return <Store333Context.Provider value={{}}>{children}</Store333Context.Provider>;
}
