import { createContext } from 'react';
export const Store010Context = createContext();
export function Store010Provider({ children }) {
  return <Store010Context.Provider value={{}}>{children}</Store010Context.Provider>;
}
