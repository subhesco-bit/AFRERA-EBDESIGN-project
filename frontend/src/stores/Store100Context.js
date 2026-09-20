import { createContext } from 'react';
export const Store100Context = createContext();
export function Store100Provider({ children }) {
  return <Store100Context.Provider value={{}}>{children}</Store100Context.Provider>;
}
