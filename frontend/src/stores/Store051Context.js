import { createContext } from 'react';
export const Store051Context = createContext();
export function Store051Provider({ children }) {
  return <Store051Context.Provider value={{}}>{children}</Store051Context.Provider>;
}
