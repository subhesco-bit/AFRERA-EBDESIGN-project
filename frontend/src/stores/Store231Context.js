import { createContext } from 'react';
export const Store231Context = createContext();
export function Store231Provider({ children }) {
  return <Store231Context.Provider value={{}}>{children}</Store231Context.Provider>;
}
