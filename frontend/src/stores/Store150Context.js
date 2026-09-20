import { createContext } from 'react';
export const Store150Context = createContext();
export function Store150Provider({ children }) {
  return <Store150Context.Provider value={{}}>{children}</Store150Context.Provider>;
}
