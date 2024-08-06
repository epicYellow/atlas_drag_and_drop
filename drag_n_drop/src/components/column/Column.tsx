import React from "react";
import {
  DraggableState,
  DropTargetState,
  IdleState,
} from "../../types/columnTypes";
import { Serializable } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { token } from "@atlaskit/tokens";

// preventing re-renders
const idle: IdleState = { type: "idle" };
const isCardOver: DropTargetState = { type: "is-card-over" };
const isDraggingState: DraggableState = { type: "is-dragging" };

const stateStyles: Partial<Record<DropTargetState["type"], SerializedStyles>> =
  {
    "is-card-over": {
      background: token("color.background.selected.hovered", "#CCE0FF"),
    },
  };

const draggableStateStyles: Partial<
  Record<DraggableState["type"], SerializedStyles>
>;

function Column() {
  return <div>Column</div>;
}

export default Column;
