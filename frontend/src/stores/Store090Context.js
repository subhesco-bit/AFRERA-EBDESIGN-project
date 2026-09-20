import { createContext } from 'react';
export const Store090Context = createContext();
export function Store090Provider({ children }) {
  return <Store090Context.Provider value={{}}>{children}</Store090Context.Provider>;
}
