import { createContext } from 'react';
export const Store061Context = createContext();
export function Store061Provider({ children }) {
  return <Store061Context.Provider value={{}}>{children}</Store061Context.Provider>;
}
