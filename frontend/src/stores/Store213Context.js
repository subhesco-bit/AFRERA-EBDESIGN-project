import { createContext } from 'react';
export const Store213Context = createContext();
export function Store213Provider({ children }) {
  return <Store213Context.Provider value={{}}>{children}</Store213Context.Provider>;
}
