import { createContext } from 'react';
export const Store076Context = createContext();
export function Store076Provider({ children }) {
  return <Store076Context.Provider value={{}}>{children}</Store076Context.Provider>;
}
