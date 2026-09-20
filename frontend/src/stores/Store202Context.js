import { createContext } from 'react';
export const Store202Context = createContext();
export function Store202Provider({ children }) {
  return <Store202Context.Provider value={{}}>{children}</Store202Context.Provider>;
}
