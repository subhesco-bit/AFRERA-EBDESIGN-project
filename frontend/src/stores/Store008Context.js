import { createContext } from 'react';
export const Store008Context = createContext();
export function Store008Provider({ children }) {
  return <Store008Context.Provider value={{}}>{children}</Store008Context.Provider>;
}
