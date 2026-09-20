import { createContext } from 'react';
export const Store215Context = createContext();
export function Store215Provider({ children }) {
  return <Store215Context.Provider value={{}}>{children}</Store215Context.Provider>;
}
