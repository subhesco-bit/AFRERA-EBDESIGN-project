import { createContext } from 'react';
export const Store160Context = createContext();
export function Store160Provider({ children }) {
  return <Store160Context.Provider value={{}}>{children}</Store160Context.Provider>;
}
