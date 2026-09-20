import { createContext } from 'react';
export const Store111Context = createContext();
export function Store111Provider({ children }) {
  return <Store111Context.Provider value={{}}>{children}</Store111Context.Provider>;
}
