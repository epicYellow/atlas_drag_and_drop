import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";

type IdleState = { type: "idle" };

type DropTargetState =
  | IdleState
  | { type: "is-card-over" }
  | { type: "is-column-over"; closestEdge: Edge | null };

type DraggableState =
  | IdleState
  | { type: "generate-safari-column-preview"; container: HTMLElement }
  | { type: "generate-column-preview" }
  | { type: "is-dragging" };

type ColumnContextProps = {
  columnId: string;
  getCardIndex: (id: string) => number;
  getNumCards: () => number;
};

export type { IdleState, DropTargetState, DraggableState, ColumnContextProps };
