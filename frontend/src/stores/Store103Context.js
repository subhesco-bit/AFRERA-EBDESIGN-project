import { createContext } from 'react';
export const Store103Context = createContext();
export function Store103Provider({ children }) {
  return <Store103Context.Provider value={{}}>{children}</Store103Context.Provider>;
}
