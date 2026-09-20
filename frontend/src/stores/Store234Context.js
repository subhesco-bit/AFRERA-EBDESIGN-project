import { createContext } from 'react';
export const Store234Context = createContext();
export function Store234Provider({ children }) {
  return <Store234Context.Provider value={{}}>{children}</Store234Context.Provider>;
}
