import { createContext } from 'react';
export const Store030Context = createContext();
export function Store030Provider({ children }) {
  return <Store030Context.Provider value={{}}>{children}</Store030Context.Provider>;
}
