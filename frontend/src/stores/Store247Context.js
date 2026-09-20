import { createContext } from 'react';
export const Store247Context = createContext();
export function Store247Provider({ children }) {
  return <Store247Context.Provider value={{}}>{children}</Store247Context.Provider>;
}
