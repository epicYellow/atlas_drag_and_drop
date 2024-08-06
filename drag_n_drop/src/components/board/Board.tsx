import { forwardRef, ReactNode } from "react";

type BoardProps = {
  children: ReactNode;
};

const Board = forwardRef<HTMLDivElement, BoardProps>(
  ({ children }: BoardProps, ref) => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          flexDirection: "column",
          grid: "8px",
          height: 480,
        }}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

export default Board;
