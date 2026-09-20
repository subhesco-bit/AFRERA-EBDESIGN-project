import { createContext } from 'react';
export const Store031Context = createContext();
export function Store031Provider({ children }) {
  return <Store031Context.Provider value={{}}>{children}</Store031Context.Provider>;
}
