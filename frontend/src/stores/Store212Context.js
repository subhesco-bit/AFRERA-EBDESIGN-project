import { createContext } from 'react';
export const Store212Context = createContext();
export function Store212Provider({ children }) {
  return <Store212Context.Provider value={{}}>{children}</Store212Context.Provider>;
}
