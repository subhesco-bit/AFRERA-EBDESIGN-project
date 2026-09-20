import { createContext } from 'react';
export const Store007Context = createContext();
export function Store007Provider({ children }) {
  return <Store007Context.Provider value={{}}>{children}</Store007Context.Provider>;
}
