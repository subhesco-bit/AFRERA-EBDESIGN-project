import { createContext } from 'react';
export const Store204Context = createContext();
export function Store204Provider({ children }) {
  return <Store204Context.Provider value={{}}>{children}</Store204Context.Provider>;
}
