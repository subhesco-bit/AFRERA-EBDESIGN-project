import { createContext } from 'react';
export const Store042Context = createContext();
export function Store042Provider({ children }) {
  return <Store042Context.Provider value={{}}>{children}</Store042Context.Provider>;
}
