import { createContext } from 'react';
export const Store091Context = createContext();
export function Store091Provider({ children }) {
  return <Store091Context.Provider value={{}}>{children}</Store091Context.Provider>;
}
