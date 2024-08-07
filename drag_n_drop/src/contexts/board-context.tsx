import { createContext, useContext } from "react";
import { BoardContextValue } from "../types/board";

export const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoardContext(): BoardContextValue {
  const value = useContext(BoardContext);
  if (!value) throw "cannot find BoardContext provider";
  return value;
}
