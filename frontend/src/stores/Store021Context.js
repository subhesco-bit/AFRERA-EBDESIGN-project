import { createContext } from 'react';
export const Store021Context = createContext();
export function Store021Provider({ children }) {
  return <Store021Context.Provider value={{}}>{children}</Store021Context.Provider>;
}
