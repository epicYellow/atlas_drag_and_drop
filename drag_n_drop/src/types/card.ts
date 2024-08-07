import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import { QuoteItem } from "./board";
import { Ref } from "react";

type CardState =
  | { type: "idle" }
  | { type: "preview"; container: HTMLElement; rect: DOMRect }
  | { type: "dragging" };

type CardPrimitiveProps = {
  closestEdge: Edge | null;
  item: QuoteItem;
  state: CardState;
  actionMenuTriggerRef?: Ref<HTMLButtonElement>;
};

export type { CardState, CardPrimitiveProps };
