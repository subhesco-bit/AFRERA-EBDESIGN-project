import { createContext } from 'react';
export const Store089Context = createContext();
export function Store089Provider({ children }) {
  return <Store089Context.Provider value={{}}>{children}</Store089Context.Provider>;
}
