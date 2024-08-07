import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { centerUnderPointer } from "@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";

import { mediumDurationMs } from "../../../constants/constants";
import { ColumnContextProps, State } from "../../../types/column";
import { ColumnType } from "../../../types/board";
import { useBoardContext } from "../../../contexts/board-context";
import { ColumnContext } from "../../../contexts/column-context";
import { createPortal } from "react-dom";
import { token } from "@atlaskit/tokens";
import Card from "./Card";

const columnStyles: React.CSSProperties = {
  width: "250px",
  backgroundColor: "elevation.surface.sunken",
  borderRadius: "border.radius.300",
  transition: `background`,
  transitionDuration: String(mediumDurationMs),
  transitionTimingFunction: "ease-in-out",
  position: "relative",
};

const stackStyles: React.CSSProperties = {
  minHeight: "0",
  flexGrow: 1,
};

const scrollContainerStyles: React.CSSProperties = {
  height: "100%",
  overflowY: "auto",
};

const cardListStyles: React.CSSProperties = {
  boxSizing: "border-box",
  minHeight: "100%",
  padding: 100,
  gap: 10,
};

const columnHeaderStyles: React.CSSProperties = {
  paddingInlineStart: 200,
  paddingInlineEnd: 200,
  paddingBlockStart: 100,
  color: "black",
  userSelect: "none",
};

// preventing re-renders with stable state objects
const idle: State = { type: "idle" };
const isCardOver: State = { type: "is-card-over" };

const stateStyles: {
  [key in State["type"]]: React.CSSProperties | undefined;
} = {
  idle: {
    cursor: "grab",
  },
  "is-card-over": {
    backgroundColor: "color.background.selected.hovered",
  },
  "is-column-over": undefined,
  /**
   * **Browser bug workaround**
   *
   * _Problem_
   * When generating a drag preview for an element
   * that has an inner scroll container, the preview can include content
   * vertically before or after the element
   *
   * _Fix_
   * We make the column a new stacking context when the preview is being generated.
   * We are not making a new stacking context at all times, as this _can_ mess up
   * other layering components inside of your card
   *
   * _Fix: Safari_
   * We have not found a great workaround yet. So for now we are just rendering
   * a custom drag preview
   */
  "generate-column-preview": {
    isolation: "isolate",
  },
  "generate-safari-column-preview": undefined,
};

const isDraggingStyles: React.CSSProperties = {
  opacity: 0.4,
};

function Column({ column }: { column: ColumnType }) {
  const columnId = column.columnId;
  const columnRef = useRef<HTMLDivElement | null>(null);
  const columnInnerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<State>(idle);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const { instanceId, registerColumn } = useBoardContext();

  useEffect(() => {
    if (!columnRef.current) return;
    if (!columnInnerRef.current) return;
    if (!headerRef.current) return;
    if (!scrollableRef.current) return;

    return combine(
      registerColumn({
        columnId,
        entry: {
          element: columnRef.current,
        },
      }),
      draggable({
        element: columnRef.current,
        dragHandle: headerRef.current,
        getInitialData: () => ({ columnId, type: "column", instanceId }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          const isSafari: boolean =
            navigator.userAgent.includes("AppleWebKit") &&
            !navigator.userAgent.includes("Chrome");

          if (!isSafari) {
            setState({ type: "generate-column-preview" });
            return;
          }
          setCustomNativeDragPreview({
            getOffset: centerUnderPointer,
            render: ({ container }) => {
              setState({
                type: "generate-safari-column-preview",
                container,
              });
              return () => setState(idle);
            },
            nativeSetDragImage,
          });
        },
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop() {
          setState(idle);
          setIsDragging(false);
        },
      }),
      dropTargetForElements({
        element: columnInnerRef.current,
        getData: () => ({ columnId }),
        canDrop: ({ source }) => {
          return (
            source.data.instanceId === instanceId && source.data.type === "card"
          );
        },
        getIsSticky: () => true,
        onDragEnter: () => setState(isCardOver),
        onDragLeave: () => setState(idle),
        onDragStart: () => setState(isCardOver),
        onDrop: () => setState(idle),
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
          const data = {
            columnId,
          };
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["left", "right"],
          });
        },
        onDragEnter: (args) => {
          setState({
            type: "is-column-over",
            closestEdge: extractClosestEdge(args.self.data),
          });
        },
        onDrag: (args) => {
          // skip react re-render if edge is not changing
          setState((current) => {
            const closestEdge: Edge | null = extractClosestEdge(args.self.data);
            if (
              current.type === "is-column-over" &&
              current.closestEdge === closestEdge
            ) {
              return current;
            }
            return {
              type: "is-column-over",
              closestEdge,
            };
          });
        },
        onDragLeave: () => {
          setState(idle);
        },
        onDrop: () => {
          setState(idle);
        },
      }),
      autoScrollForElements({
        element: scrollableRef.current,
        canScroll: ({ source }) =>
          source.data.instanceId === instanceId && source.data.type === "card",
      })
    );
  }, [columnId, registerColumn, instanceId]);

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

  const contextValue: ColumnContextProps = useMemo(() => {
    return { columnId, getCardIndex, getNumCards };
  }, [columnId, getCardIndex, getNumCards]);

  return (
    <ColumnContext.Provider value={contextValue}>
      <div
        ref={columnRef}
        style={{
          ...columnStyles,
          ...stateStyles[state.type],
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div style={stackStyles} ref={columnInnerRef}>
          <div
            style={{
              ...stackStyles,
              ...(isDragging ? isDraggingStyles : undefined),
            }}
          >
            <div style={columnHeaderStyles}>
              <h3>{column.title}</h3>
            </div>
          </div>
          <div style={scrollContainerStyles} ref={scrollableRef}>
            <div style={cardListStyles}>
              {column.items.map((item) => (
                <Card item={item} key={item.id} />
              ))}
            </div>
          </div>
        </div>
        {state.type === "is-column-over" && state.closestEdge && (
          <DropIndicator
            edge={state.closestEdge}
            gap={token("space.200", "0")}
          />
        )}
      </div>
      {state.type === "generate-safari-column-preview"
        ? createPortal(<SafariColumnPreview column={column} />, state.container)
        : null}
    </ColumnContext.Provider>
  );
}

export default Column;

const safariPreviewStyles = {
  width: "250px",
  backgroundColor: "yellow",
  borderRadius: "200",
  padding: "200",
};

function SafariColumnPreview({ column }: { column: ColumnType }) {
  return (
    <div style={{ ...columnHeaderStyles, ...safariPreviewStyles }}>
      <h5>{column.title}</h5>
    </div>
  );
}
