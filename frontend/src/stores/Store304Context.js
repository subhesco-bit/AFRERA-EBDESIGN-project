import { createContext } from 'react';
export const Store304Context = createContext();
export function Store304Provider({ children }) {
  return <Store304Context.Provider value={{}}>{children}</Store304Context.Provider>;
}
