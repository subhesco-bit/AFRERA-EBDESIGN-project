import { createContext } from 'react';
export const Store102Context = createContext();
export function Store102Provider({ children }) {
  return <Store102Context.Provider value={{}}>{children}</Store102Context.Provider>;
}
