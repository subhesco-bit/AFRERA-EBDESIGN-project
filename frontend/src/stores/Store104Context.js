import { createContext } from 'react';
export const Store104Context = createContext();
export function Store104Provider({ children }) {
  return <Store104Context.Provider value={{}}>{children}</Store104Context.Provider>;
}
