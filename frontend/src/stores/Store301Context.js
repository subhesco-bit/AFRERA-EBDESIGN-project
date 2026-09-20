import { createContext } from 'react';
export const Store301Context = createContext();
export function Store301Provider({ children }) {
  return <Store301Context.Provider value={{}}>{children}</Store301Context.Provider>;
}
