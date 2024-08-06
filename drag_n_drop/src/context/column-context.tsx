import { createContext, useContext } from "react";
import { ColumnContextProps } from "../types/columnTypes";

const ColumnContext = createContext<ColumnContextProps | null>(null);

function useColumnContext(): ColumnContextProps {
  const value = useContext(ColumnContext);
  if (!value) throw "cannot find ColumnContext provider";
  return value;
}

export { ColumnContext, useColumnContext };
