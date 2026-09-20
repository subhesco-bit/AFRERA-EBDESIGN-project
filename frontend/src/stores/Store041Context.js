import { createContext } from 'react';
export const Store041Context = createContext();
export function Store041Provider({ children }) {
  return <Store041Context.Provider value={{}}>{children}</Store041Context.Provider>;
}
