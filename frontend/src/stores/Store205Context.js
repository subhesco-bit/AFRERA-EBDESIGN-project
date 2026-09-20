import { createContext } from 'react';
export const Store205Context = createContext();
export function Store205Provider({ children }) {
  return <Store205Context.Provider value={{}}>{children}</Store205Context.Provider>;
}
