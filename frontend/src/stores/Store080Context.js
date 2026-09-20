import { createContext } from 'react';
export const Store080Context = createContext();
export function Store080Provider({ children }) {
  return <Store080Context.Provider value={{}}>{children}</Store080Context.Provider>;
}
