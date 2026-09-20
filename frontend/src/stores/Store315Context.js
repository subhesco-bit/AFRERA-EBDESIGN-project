import { createContext } from 'react';
export const Store315Context = createContext();
export function Store315Provider({ children }) {
  return <Store315Context.Provider value={{}}>{children}</Store315Context.Provider>;
}
