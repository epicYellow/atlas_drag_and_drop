import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import { Ref } from "react";
import { QuoteItem } from "./boardTypes";

type CardDraggableState =
  | { type: "idle" }
  | { type: "preview"; container: HTMLElement; rect: DOMRect }
  | { type: "dragging" };

type CardPrimitiveProps = {
  closestEdge: Edge | null;
  item: QuoteItem;
  state: CardDraggableState;
  actionMenuTriggerRef?: Ref<HTMLButtonElement>;
};

export type { CardDraggableState, CardPrimitiveProps };
