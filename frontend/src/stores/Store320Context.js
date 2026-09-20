import { createContext } from 'react';
export const Store320Context = createContext();
export function Store320Provider({ children }) {
  return <Store320Context.Provider value={{}}>{children}</Store320Context.Provider>;
}
