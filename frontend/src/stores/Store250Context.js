import { createContext } from 'react';
export const Store250Context = createContext();
export function Store250Provider({ children }) {
  return <Store250Context.Provider value={{}}>{children}</Store250Context.Provider>;
}
