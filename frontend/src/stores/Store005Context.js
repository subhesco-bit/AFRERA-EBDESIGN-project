import { createContext } from 'react';
export const Store005Context = createContext();
export function Store005Provider({ children }) {
  return <Store005Context.Provider value={{}}>{children}</Store005Context.Provider>;
}
