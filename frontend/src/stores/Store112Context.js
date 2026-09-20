import { createContext } from 'react';
export const Store112Context = createContext();
export function Store112Provider({ children }) {
  return <Store112Context.Provider value={{}}>{children}</Store112Context.Provider>;
}
