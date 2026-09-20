import { createContext } from 'react';
export const Store070Context = createContext();
export function Store070Provider({ children }) {
  return <Store070Context.Provider value={{}}>{children}</Store070Context.Provider>;
}
