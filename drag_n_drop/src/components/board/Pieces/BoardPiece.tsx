import React, { forwardRef, ReactNode, useEffect } from "react";
import { autoScrollWindowForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";

import { useBoardContext } from "../../../contexts/board-context";

type BoardProps = {
  children: ReactNode;
};

const boardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  // gap: 200,
  flexDirection: "column",
  // height: "300px",
};

const BoardPiece = forwardRef<HTMLDivElement, BoardProps>(
  ({ children }: BoardProps, ref) => {
    const { instanceId } = useBoardContext();

    useEffect(() => {
      return autoScrollWindowForElements({
        canScroll: ({ source }) => source.data.instanceId === instanceId,
      });
    }, [instanceId]);

    return (
      <div style={boardStyle} ref={ref}>
        {children}
      </div>
    );
  }
);

export default BoardPiece;
