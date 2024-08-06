import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as liveRegion from "@atlaskit/pragmatic-drag-and-drop-live-region";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";

import "./App.css";
import {
  BoardContextProps,
  BoardState,
  ColumnMap,
  ColumnType,
  KeyboardOperation,
  QuoteItem,
} from "./types/boardTypes";
import { getInitialData } from "./helpers/getInitialData";
import { createRegistry } from "./helpers/createRegistery";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import { BoardContext } from "./context/board-context";
import Board from "./components/board/Board";

function App() {
  const [data, setData] = useState<BoardState>(() => {
    const base = getInitialData();
    return {
      ...base,
      lastKeyboardOperation: null,
    };
  });

  const stableData = useRef(data);

  useEffect(() => {
    stableData.current = data;
  }, [data]);

  const [{ registry, registerCard }] = useState(createRegistry);

  const { lastKeyboardOperation } = data;

  // In this effect we are performing two post accessible operation actions:
  // 1. Tell the user what occurred with a screen reader announcement
  // 2. Restore focus to the relevant control so that the user
  //    can continue to quickly interact with the item
  useEffect(() => {
    if (lastKeyboardOperation === null) {
      return;
    }

    if (lastKeyboardOperation.type === "column-reorder") {
      const { startIndex, finishIndex } = lastKeyboardOperation;
      const { columnMap, orderedColumnIds } = stableData.current;

      const sourceColumn = columnMap[orderedColumnIds[finishIndex]];

      liveRegion.announce(
        `You've moved ${sourceColumn.title} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${orderedColumnIds.length}.`
      );

      return;
    }

    if (lastKeyboardOperation.type === "card-reorder") {
      const { columnId, startIndex, finishIndex } = lastKeyboardOperation;

      const { columnMap } = stableData.current;
      const column = columnMap[columnId];
      const item = column.items[startIndex];

      liveRegion.announce(
        `You've moved ${item.desc} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${column.items.length} in the ${
          column.title
        } column.`
      );

      return;
    }

    if (lastKeyboardOperation.type === "card-move") {
      const {
        finishColumnId,
        itemIndexInStartColumn,
        itemIndexInFinishColumn,
      } = lastKeyboardOperation;

      const data = stableData.current;
      const destinationColumn = data.columnMap[finishColumnId];
      const item = destinationColumn.items[itemIndexInFinishColumn];

      const finishPosition =
        typeof itemIndexInFinishColumn === "number"
          ? itemIndexInFinishColumn + 1
          : destinationColumn.items.length;

      liveRegion.announce(
        `You've moved ${item.desc} from position ${
          itemIndexInStartColumn + 1
        } to position ${finishPosition} in the ${
          destinationColumn.title
        } column.`
      );

      const cardEntry = registry.cards.get(item.id);
      if (cardEntry === undefined) return;
      /**
       * Because the card has moved column, it will have remounted.
       * This means we need to manually restore focus to it.
       */
      cardEntry.actionMenuTrigger.focus();

      return;
    }
  }, [lastKeyboardOperation, registry]);

  useEffect(() => {
    return liveRegion.cleanup();
  }, []);

  const getColumns = useCallback(() => {
    const { columnMap, orderedColumnIds } = stableData.current;
    return orderedColumnIds.map((columnId) => columnMap[columnId]);
  }, []);

  type cardColumnDetails = {
    startIndex: number;
    finishIndex: number;
    source?: "keyboard" | "pointer";
  };

  const reorderColumn = useCallback(
    ({ startIndex, finishIndex, source = "keyboard" }: cardColumnDetails) => {
      setData((data) => {
        const operation: KeyboardOperation | null =
          source === "keyboard"
            ? {
                type: "column-reorder",
                columnId: data.orderedColumnIds[startIndex],
                startIndex,
                finishIndex,
              }
            : null;
        return {
          ...data,
          orderedColumnIds: reorder({
            list: data.orderedColumnIds,
            startIndex,
            finishIndex,
          }),
          lastKeyboardOperation: operation,
        };
      });
    },
    []
  );

  const reorderCard = useCallback(
    ({
      columnId,
      startIndex,
      finishIndex,
      source = "keyboard",
    }: cardColumnDetails & { columnId: string }) => {
      setData((data) => {
        const sourceColumn = data.columnMap[columnId];
        const updateItems = reorder({
          list: sourceColumn.items,
          startIndex,
          finishIndex,
        });

        const updateSourceColumn: ColumnType = {
          ...sourceColumn,
          items: updateItems,
        };

        const updatedMap: ColumnMap = {
          ...data.columnMap,
          [columnId]: updateSourceColumn,
        };

        const operation: KeyboardOperation | null =
          source === "keyboard"
            ? { type: "card-reorder", columnId, startIndex, finishIndex }
            : null;

        return {
          ...data,
          columnMap: updatedMap,
          lastKeyboardOperation: operation,
        };
      });
    },
    []
  );

  type MoveCard = {
    startColumnId: string;
    finishColumnId: string;
    itemIndexInStartColumn: number;
    itemIndexInFinishColumn?: number;
    source?: "pointer" | "keyboard";
  };

  const moveCard = useCallback(
    ({
      startColumnId,
      finishColumnId,
      itemIndexInStartColumn,
      itemIndexInFinishColumn,
      source = "keyboard",
    }: MoveCard) => {
      setData((data) => {
        const sourceColumn = data.columnMap[startColumnId];
        const destinationColumn = data.columnMap[finishColumnId];
        const item: QuoteItem = sourceColumn.items[itemIndexInStartColumn];

        const destinationItems = Array.from(destinationColumn.items);
        if (typeof itemIndexInFinishColumn === "number") {
          destinationItems.splice(itemIndexInFinishColumn, 0, item);
        } else {
          destinationItems.push(item);
        }

        const updateMap = {
          ...data.columnMap,
          [startColumnId]: {
            ...sourceColumn,
            items: sourceColumn.items.filter((i) => i.id !== item.id),
          },
          [finishColumnId]: {
            ...destinationColumn,
            item: destinationItems,
          },
        };

        const operation: KeyboardOperation | null =
          source === "keyboard"
            ? {
                type: "card-move",
                finishColumnId,
                itemIndexInStartColumn,
                itemIndexInFinishColumn:
                  typeof itemIndexInFinishColumn === "number"
                    ? itemIndexInFinishColumn
                    : destinationItems.length - 1,
              }
            : null;

        return {
          ...data,
          columnMap: updateMap,
          lastKeyboardOperation: operation,
        };
      });
    },
    []
  );

  const [instanceId] = useState(() => Symbol("instance-id"));

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return source.data.instanceId === instanceId;
        },
        onDrop(args) {
          const { location, source } = args;
          // didn't drop on anything
          if (!location.current.dropTargets.length) {
            return;
          }
          // need to handle drop

          // 1. remove element from original position
          // 2. move to new position

          if (source.data.type === "column") {
            const startIndex: number = data.orderedColumnIds.findIndex(
              (columnId) => columnId === source.data.columnId
            );

            const target = location.current.dropTargets[0];
            const indexOfTarget: number = data.orderedColumnIds.findIndex(
              (id) => id === target.data.columnId
            );
            const closestEdgeOfTarget: Edge | null = extractClosestEdge(
              target.data
            );

            const finishIndex = getReorderDestinationIndex({
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: "horizontal",
            });

            reorderColumn({ startIndex, finishIndex, source: "pointer" });
          }
          // Dragging a card
          if (source.data.type === "card") {
            const itemId = source.data.id;
            if (typeof itemId !== "string") return;
            // TODO: these lines not needed if item has columnId on it
            const [, startColumnRecord] = location.initial.dropTargets;
            const sourceId = startColumnRecord.data.columnId;
            if (typeof sourceId !== "string") return;
            const sourceColumn = data.columnMap[sourceId];
            const itemIndex = sourceColumn.items.findIndex(
              (item) => item.id === itemId
            );

            if (location.current.dropTargets.length === 1) {
              const [destinationColumnRecord] = location.current.dropTargets;
              const destinationId = destinationColumnRecord.data.columnId;
              if (typeof destinationId !== "string") return;
              const destinationColumn = data.columnMap[destinationId];
              if (!destinationColumn) return;

              // reordering in same column
              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget: sourceColumn.items.length - 1,
                  closestEdgeOfTarget: null,
                  axis: "vertical",
                });
                reorderCard({
                  columnId: sourceColumn.columnId,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  source: "pointer",
                });
                return;
              }

              // moving to a new column
              moveCard({
                itemIndexInStartColumn: itemIndex,
                startColumnId: sourceColumn.columnId,
                finishColumnId: destinationColumn.columnId,
                source: "pointer",
              });
              return;
            }

            // dropping in a column (relative to a card)
            if (location.current.dropTargets.length === 2) {
              const [destinationCardRecord, destinationColumnRecord] =
                location.current.dropTargets;
              const destinationColumnId = destinationColumnRecord.data.columnId;
              if (typeof destinationColumnId !== "string") return;
              const destinationColumn = data.columnMap[destinationColumnId];

              const indexOfTarget = destinationColumn.items.findIndex(
                (item) => item.id === destinationCardRecord.data.itemId
              );
              const closestEdgeOfTarget: Edge | null = extractClosestEdge(
                destinationCardRecord.data
              );

              // case 1: ordering in the same column
              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget,
                  closestEdgeOfTarget,
                  axis: "vertical",
                });
                reorderCard({
                  columnId: sourceColumn.columnId,
                  startIndex: itemIndex,
                  finishIndex: destinationIndex,
                  source: "pointer",
                });
                return;
              }

              // case 2: moving into a new column relative to a card

              const destinationIndex =
                closestEdgeOfTarget === "bottom"
                  ? indexOfTarget + 1
                  : indexOfTarget;

              moveCard({
                itemIndexInStartColumn: itemIndex,
                startColumnId: sourceColumn.columnId,
                finishColumnId: destinationColumn.columnId,
                itemIndexInFinishColumn: destinationIndex,
                source: "pointer",
              });
            }
          }
        },
      })
    );
  }, [data, instanceId, moveCard, reorderCard, reorderColumn]);

  const contextValues: BoardContextProps = useMemo(() => {
    return {
      getColumns,
      reorderColumn,
      reorderCard,
      moveCard,
      registerCard,
      instanceId,
    };
  }, [
    getColumns,
    instanceId,
    moveCard,
    registerCard,
    reorderCard,
    reorderColumn,
  ]);

  return (
    <BoardContext.Provider value={contextValues}>
      <Board>
        {data.orderedColumnIds.map((columnId) => {
          return <div>{columnId}</div>;
        })}
      </Board>
    </BoardContext.Provider>
  );
}

export default App;
