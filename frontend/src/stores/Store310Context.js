import { createContext } from 'react';
export const Store310Context = createContext();
export function Store310Provider({ children }) {
  return <Store310Context.Provider value={{}}>{children}</Store310Context.Provider>;
}
