import { createContext } from 'react';
export const Store281Context = createContext();
export function Store281Provider({ children }) {
  return <Store281Context.Provider value={{}}>{children}</Store281Context.Provider>;
}
