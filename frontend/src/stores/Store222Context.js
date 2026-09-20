import { createContext } from 'react';
export const Store222Context = createContext();
export function Store222Provider({ children }) {
  return <Store222Context.Provider value={{}}>{children}</Store222Context.Provider>;
}
