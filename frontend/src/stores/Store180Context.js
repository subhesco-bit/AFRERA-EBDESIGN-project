import { createContext } from 'react';
export const Store180Context = createContext();
export function Store180Provider({ children }) {
  return <Store180Context.Provider value={{}}>{children}</Store180Context.Provider>;
}
