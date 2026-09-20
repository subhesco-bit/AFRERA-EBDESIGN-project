import { createContext } from 'react';
export const Store192Context = createContext();
export function Store192Provider({ children }) {
  return <Store192Context.Provider value={{}}>{children}</Store192Context.Provider>;
}
