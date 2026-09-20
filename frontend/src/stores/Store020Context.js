import { createContext } from 'react';
export const Store020Context = createContext();
export function Store020Provider({ children }) {
  return <Store020Context.Provider value={{}}>{children}</Store020Context.Provider>;
}
