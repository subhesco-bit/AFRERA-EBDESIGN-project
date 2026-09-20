import { createContext } from 'react';
export const Store211Context = createContext();
export function Store211Provider({ children }) {
  return <Store211Context.Provider value={{}}>{children}</Store211Context.Provider>;
}
