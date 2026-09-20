import { createContext } from 'react';
export const Store099Context = createContext();
export function Store099Provider({ children }) {
  return <Store099Context.Provider value={{}}>{children}</Store099Context.Provider>;
}
