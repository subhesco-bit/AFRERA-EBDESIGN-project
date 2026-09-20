import { createContext } from 'react';
export const Store023Context = createContext();
export function Store023Provider({ children }) {
  return <Store023Context.Provider value={{}}>{children}</Store023Context.Provider>;
}
