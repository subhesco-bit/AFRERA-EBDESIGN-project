import { createContext } from 'react';
export const Store004Context = createContext();
export function Store004Provider({ children }) {
  return <Store004Context.Provider value={{}}>{children}</Store004Context.Provider>;
}
