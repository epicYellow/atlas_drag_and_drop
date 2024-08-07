import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";

type State =
  | { type: "idle" }
  | { type: "is-card-over" }
  | { type: "is-column-over"; closestEdge: Edge | null }
  | { type: "generate-safari-column-preview"; container: HTMLElement }
  | { type: "generate-column-preview" };

type ColumnContextProps = {
  columnId: string;
  getCardIndex: (id: string) => number;
  getNumCards: () => number;
};

export type { State, ColumnContextProps };
