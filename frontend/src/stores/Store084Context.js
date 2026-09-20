import { createContext } from 'react';
export const Store084Context = createContext();
export function Store084Provider({ children }) {
  return <Store084Context.Provider value={{}}>{children}</Store084Context.Provider>;
}
