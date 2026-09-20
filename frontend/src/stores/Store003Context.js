import { createContext } from 'react';
export const Store003Context = createContext();
export function Store003Provider({ children }) {
  return <Store003Context.Provider value={{}}>{children}</Store003Context.Provider>;
}
