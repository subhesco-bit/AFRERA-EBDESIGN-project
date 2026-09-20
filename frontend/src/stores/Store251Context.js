import { createContext } from 'react';
export const Store251Context = createContext();
export function Store251Provider({ children }) {
  return <Store251Context.Provider value={{}}>{children}</Store251Context.Provider>;
}
