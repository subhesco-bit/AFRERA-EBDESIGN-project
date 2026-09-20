import { createContext } from 'react';
export const Store303Context = createContext();
export function Store303Provider({ children }) {
  return <Store303Context.Provider value={{}}>{children}</Store303Context.Provider>;
}
