import { createContext } from 'react';
export const Store240Context = createContext();
export function Store240Provider({ children }) {
  return <Store240Context.Provider value={{}}>{children}</Store240Context.Provider>;
}
