import { createContext } from 'react';
export const Store321Context = createContext();
export function Store321Provider({ children }) {
  return <Store321Context.Provider value={{}}>{children}</Store321Context.Provider>;
}
