import { createContext } from 'react';
export const Store009Context = createContext();
export function Store009Provider({ children }) {
  return <Store009Context.Provider value={{}}>{children}</Store009Context.Provider>;
}
