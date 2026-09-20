import { createContext } from 'react';
export const Store330Context = createContext();
export function Store330Provider({ children }) {
  return <Store330Context.Provider value={{}}>{children}</Store330Context.Provider>;
}
