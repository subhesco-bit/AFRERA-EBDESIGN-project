import { createContext } from 'react';
export const Store002Context = createContext();
export function Store002Provider({ children }) {
  return <Store002Context.Provider value={{}}>{children}</Store002Context.Provider>;
}
