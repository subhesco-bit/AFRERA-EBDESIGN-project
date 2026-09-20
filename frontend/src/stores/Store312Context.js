import { createContext } from 'react';
export const Store312Context = createContext();
export function Store312Provider({ children }) {
  return <Store312Context.Provider value={{}}>{children}</Store312Context.Provider>;
}
