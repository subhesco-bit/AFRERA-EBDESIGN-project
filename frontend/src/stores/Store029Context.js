import { createContext } from 'react';
export const Store029Context = createContext();
export function Store029Provider({ children }) {
  return <Store029Context.Provider value={{}}>{children}</Store029Context.Provider>;
}
