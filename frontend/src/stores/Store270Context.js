import { createContext } from 'react';
export const Store270Context = createContext();
export function Store270Provider({ children }) {
  return <Store270Context.Provider value={{}}>{children}</Store270Context.Provider>;
}
