import { createContext } from 'react';
export const Store072Context = createContext();
export function Store072Provider({ children }) {
  return <Store072Context.Provider value={{}}>{children}</Store072Context.Provider>;
}
