import { createContext } from 'react';
export const Store163Context = createContext();
export function Store163Provider({ children }) {
  return <Store163Context.Provider value={{}}>{children}</Store163Context.Provider>;
}
