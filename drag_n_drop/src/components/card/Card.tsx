import React, { forwardRef, useCallback, Fragment } from "react";
import { CardDraggableState, CardPrimitiveProps } from "../../types/cardTypes";
import { ColumnType } from "../../types/boardTypes";
import { useBoardContext } from "../../context/board-context";
import { useColumnContext } from "../../context/column-context";
import { DropdownItem } from "@atlaskit/dropdown-menu";
import DropIndicator from "@atlaskit/pragmatic-drag-and-drop-react-indicator/box";

const idleState: CardDraggableState = { type: "idle" };
const draggingState: CardDraggableState = { type: "dragging" };

function MoveToOtherColumnItem({
  targetColumn,
  startIndex,
}: {
  targetColumn: ColumnType;
  startIndex: number;
}) {
  const { moveCard } = useBoardContext();
  const { columnId } = useColumnContext();

  const onClick = useCallback(() => {
    moveCard({
      startColumnId: columnId,
      finishColumnId: targetColumn.columnId,
      itemIndexInStartColumn: startIndex,
    });
  }, [columnId, moveCard, startIndex, targetColumn.columnId]);

  return <DropdownItem onClick={onClick}>{targetColumn.title}</DropdownItem>;
}

const CardPrimitive = forwardRef<HTMLDivElement, CardPrimitiveProps>(
  function CardPrimitive(
    { closestEdge, item, state, actionMenuTriggerRef },
    ref
  ) {
    const { desc, rate, id } = item;

    return (
      <div key={id} ref={ref}>
        <p>{desc}</p>
        <p>rate: R{rate}</p>
        {closestEdge && <DropIndicator edge={closestEdge} gap={`8px`} />}
      </div>
    );
  }
);

function Card() {
  return <div>Card</div>;
}

export default Card;
