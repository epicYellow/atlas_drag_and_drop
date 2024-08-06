import { createContext, useContext } from "react";
import { BoardContextProps } from "../types/boardTypes";

const BoardContext = createContext<BoardContextProps | null>(null);

function useBoardContext(): BoardContextProps {
  const value = useContext(BoardContext);
  if (!value) throw "cannot find BoardContext provider";
  return value;
}

export { BoardContext, useBoardContext };
