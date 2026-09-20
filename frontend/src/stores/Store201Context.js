import { createContext } from 'react';
export const Store201Context = createContext();
export function Store201Provider({ children }) {
  return <Store201Context.Provider value={{}}>{children}</Store201Context.Provider>;
}
