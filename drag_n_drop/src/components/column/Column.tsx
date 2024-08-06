import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColumnContextProps,
  DraggableState,
  DropTargetState,
  IdleState,
} from "../../types/columnTypes";
import { token } from "@atlaskit/tokens";
import { ColumnType } from "../../types/boardTypes";
import { useBoardContext } from "../../context/board-context";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-indicator/box";

import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { centerUnderPointer } from "@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer";
import { ColumnContext } from "../../context/column-context";
import { createPortal } from "react-dom";

// preventing re-renders
const idle: IdleState = { type: "idle" };
const isCardOver: DropTargetState = { type: "is-card-over" };
const isDraggingState: DraggableState = { type: "is-dragging" };

const stateStyles: Partial<
  Record<DropTargetState["type"], React.CSSProperties>
> = {
  "is-card-over": {
    background: token("color.background.selected.hovered", "#CCE0FF"),
  },
};

const draggableStateStyles: Partial<
  Record<DraggableState["type"], React.CSSProperties>
> = {
  "generate-column-preview": {
    isolation: "isolate",
  },
  "generate-safari-column-preview": undefined,
  "is-dragging": {
    opacity: 0.4,
  },
};

function Column({ column }: { column: ColumnType }) {
  const columnId = column.columnId;
  const columnRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const cardListRef = useRef<HTMLDivElement | null>(null);
  const [dropTargetState, setDropTargetState] = useState<DropTargetState>(idle);
  const [draggableState, setDraggableState] = useState<DraggableState>(idle);

  const { instanceId } = useBoardContext();

  useEffect(() => {
    if (!columnRef.current) return;
    if (!headerRef.current) return;
    if (!cardListRef.current) return;

    return combine(
      draggable({
        element: columnRef.current,
        dragHandle: headerRef.current,
        getInitialData: () => ({ columnId, type: "column", instanceId }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          const isSafari: boolean =
            navigator.userAgent.includes("AppleWebKit") &&
            !navigator.userAgent.includes("Chrome");

          if (!isSafari) {
            setDraggableState({ type: "generate-column-preview" });
            return;
          }

          setCustomNativeDragPreview({
            getOffset: centerUnderPointer,
            render: ({ container }) => {
              setDraggableState({
                type: "generate-safari-column-preview",
                container,
              });
              return () => setDraggableState(idle);
            },
            nativeSetDragImage,
          });
        },
        onDragStart: () => {
          setDraggableState(isDraggingState);
        },
        onDrop() {
          setDraggableState(idle);
        },
      }),
      dropTargetForElements({
        element: cardListRef.current,
        getData: () => ({ columnId }),
        canDrop: ({ source }) => {
          return (
            source.data.instanceId === instanceId && source.data.type === "card"
          );
        },
        getIsSticky: () => true,
        onDragEnter: () => setDropTargetState(isCardOver),
        onDragLeave: () => setDropTargetState(idle),
        onDragStart: () => setDropTargetState(isCardOver),
        onDrop: () => setDropTargetState(idle),
      }),
      dropTargetForElements({
        element: columnRef.current,
        canDrop: ({ source }) => {
          return (
            source.data.instanceId === instanceId &&
            source.data.type === "column"
          );
        },
        getIsSticky: () => true,
        getData: ({ input, element }) => {
          const data = { columnId };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["left", "right"],
          });
        },
        onDragEnter: (args) => {
          setDropTargetState({
            type: "is-column-over",
            closestEdge: extractClosestEdge(args.self.data),
          });
        },
        onDrag: (args) => {
          setDropTargetState((current) => {
            const closestEdge: Edge | null = extractClosestEdge(args.self.data);
            if (
              current.type === "is-column-over" &&
              current.closestEdge === closestEdge
            ) {
              return current;
            }
            return { type: "is-column-over", closestEdge };
          });
        },
        onDragLeave: () => {
          setDropTargetState(idle);
        },
        onDrop: () => {
          setDropTargetState(idle);
        },
      })
    );
  }, [columnId, instanceId]);

  const stableItems = useRef(column.items);

  useEffect(() => {
    stableItems.current = column.items;
  }, [column.items]);

  const getCardIndex = useCallback((id: string) => {
    return stableItems.current.findIndex((item) => item.id === id);
  }, []);

  const getNumCards = useCallback(() => {
    return stableItems.current.length;
  }, []);

  const contextValues: ColumnContextProps = useMemo(() => {
    return { columnId, getCardIndex, getNumCards };
  }, [columnId, getCardIndex, getNumCards]);

  return (
    <ColumnContext.Provider value={contextValues}>
      <div
        style={
          (stateStyles[dropTargetState.type],
          draggableStateStyles[draggableState.type])
        }
        ref={columnRef}
      >
        <h3 ref={headerRef}>{column.title}</h3>
        <br />
        <div>
          {column.items.map((item) => (
            <div key={item.id}>{item.desc}</div>
          ))}
        </div>
        {dropTargetState.type === "is-column-over" &&
          dropTargetState.closestEdge && (
            <DropIndicator edge={dropTargetState.closestEdge} gap={`8px`} />
          )}
      </div>
      {draggableState.type === "generate-safari-column-preview" &&
        createPortal(
          <SafariColumnPreview column={column} />,
          draggableState.container
        )}
    </ColumnContext.Provider>
  );
}

function SafariColumnPreview({ column }: { column: ColumnType }) {
  return (
    <div>
      <h1>{column.title}</h1>
    </div>
  );
}

export default Column;
