import { createContext } from 'react';
export const Store006Context = createContext();
export function Store006Provider({ children }) {
  return <Store006Context.Provider value={{}}>{children}</Store006Context.Provider>;
}
