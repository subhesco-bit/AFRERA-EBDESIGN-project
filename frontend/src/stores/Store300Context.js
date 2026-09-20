import { createContext } from 'react';
export const Store300Context = createContext();
export function Store300Provider({ children }) {
  return <Store300Context.Provider value={{}}>{children}</Store300Context.Provider>;
}
