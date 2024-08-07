import { createContext, useContext } from "react";
import { ColumnContextProps } from "../types/column";

export const ColumnContext = createContext<ColumnContextProps | null>(null);

export function useColumnContext(): ColumnContextProps {
  const value = useContext(ColumnContext);
  if (!value) throw "cannot find ColumnContext provider";
  return value;
}
