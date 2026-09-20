import { createContext } from 'react';
export const Store040Context = createContext();
export function Store040Provider({ children }) {
  return <Store040Context.Provider value={{}}>{children}</Store040Context.Provider>;
}
