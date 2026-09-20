import { createContext } from 'react';
export const Store060Context = createContext();
export function Store060Provider({ children }) {
  return <Store060Context.Provider value={{}}>{children}</Store060Context.Provider>;
}
