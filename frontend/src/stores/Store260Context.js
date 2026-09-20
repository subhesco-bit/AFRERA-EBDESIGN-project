import { createContext } from 'react';
export const Store260Context = createContext();
export function Store260Provider({ children }) {
  return <Store260Context.Provider value={{}}>{children}</Store260Context.Provider>;
}
