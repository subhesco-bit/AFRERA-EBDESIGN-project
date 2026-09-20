import { createContext } from 'react';
export const Store098Context = createContext();
export function Store098Provider({ children }) {
  return <Store098Context.Provider value={{}}>{children}</Store098Context.Provider>;
}
