import { createContext } from 'react';
export const Store256Context = createContext();
export function Store256Provider({ children }) {
  return <Store256Context.Provider value={{}}>{children}</Store256Context.Provider>;
}
