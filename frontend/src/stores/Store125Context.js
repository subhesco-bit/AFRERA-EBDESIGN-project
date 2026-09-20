import { createContext } from 'react';
export const Store125Context = createContext();
export function Store125Provider({ children }) {
  return <Store125Context.Provider value={{}}>{children}</Store125Context.Provider>;
}
