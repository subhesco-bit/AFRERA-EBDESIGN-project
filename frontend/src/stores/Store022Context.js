import { createContext } from 'react';
export const Store022Context = createContext();
export function Store022Provider({ children }) {
  return <Store022Context.Provider value={{}}>{children}</Store022Context.Provider>;
}
