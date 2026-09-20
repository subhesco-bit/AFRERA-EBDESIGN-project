import { createContext } from 'react';
export const Store120Context = createContext();
export function Store120Provider({ children }) {
  return <Store120Context.Provider value={{}}>{children}</Store120Context.Provider>;
}
