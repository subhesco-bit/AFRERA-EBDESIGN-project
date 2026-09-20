import { createContext } from 'react';
export const Store065Context = createContext();
export function Store065Provider({ children }) {
  return <Store065Context.Provider value={{}}>{children}</Store065Context.Provider>;
}
