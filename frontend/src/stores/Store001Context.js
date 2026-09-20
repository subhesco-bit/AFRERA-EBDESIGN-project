import { createContext } from 'react';
export const Store001Context = createContext();
export function Store001Provider({ children }) {
  return <Store001Context.Provider value={{}}>{children}</Store001Context.Provider>;
}
