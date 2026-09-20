import { createContext } from 'react';
export const Store101Context = createContext();
export function Store101Provider({ children }) {
  return <Store101Context.Provider value={{}}>{children}</Store101Context.Provider>;
}
