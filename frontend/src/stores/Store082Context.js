import { createContext } from 'react';
export const Store082Context = createContext();
export function Store082Provider({ children }) {
  return <Store082Context.Provider value={{}}>{children}</Store082Context.Provider>;
}
