import { createContext } from 'react';
export const Store280Context = createContext();
export function Store280Provider({ children }) {
  return <Store280Context.Provider value={{}}>{children}</Store280Context.Provider>;
}
