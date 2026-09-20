import { createContext } from 'react';
export const Store188Context = createContext();
export function Store188Provider({ children }) {
  return <Store188Context.Provider value={{}}>{children}</Store188Context.Provider>;
}
