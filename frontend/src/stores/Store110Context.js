import { createContext } from 'react';
export const Store110Context = createContext();
export function Store110Provider({ children }) {
  return <Store110Context.Provider value={{}}>{children}</Store110Context.Provider>;
}
