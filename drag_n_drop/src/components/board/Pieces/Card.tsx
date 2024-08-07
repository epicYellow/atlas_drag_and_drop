import React, {
  forwardRef,
  Fragment,
  Ref,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import Avatar from "@atlaskit/avatar";

import { CardPrimitiveProps, CardState } from "../../../types/card";
import { QuoteItem } from "../../../types/board";
import ReactDOM from "react-dom";
import { useBoardContext } from "../../../contexts/board-context";
import { token } from "@atlaskit/tokens";

const idleState: CardState = { type: "idle" };
const draggingState: CardState = { type: "dragging" };

const noMarginStyles = { margin: "0" };

const baseStyles: React.CSSProperties = {
  width: "100%",
  padding: "space.100",
  backgroundColor: "aqua",
  borderRadius: "200",
  position: "relative",
};

const stateStyles: {
  [Key in CardState["type"]]: React.CSSProperties | undefined;
} = {
  idle: {
    cursor: "grab",
    boxShadow: "elevation.shadow.raised",
  },
  dragging: {
    opacity: 0.4,
    boxShadow: "elevation.shadow.raised",
  },
  // no shadow for preview - the platform will add it's own drop shadow
  preview: undefined,
};

// const buttonColumnStyles = {
//   alignSelf: "start",
// };

const CardPrimitive = forwardRef<HTMLDivElement, CardPrimitiveProps>(
  function CardPrimitive({ closestEdge, item, state }, ref) {
    const { desc, rate, type, id } = item;

    return (
      <div
        ref={ref}
        // testId={`item-${userId}`}
        id={`item-${id}`}
        style={{
          ...baseStyles,
          ...stateStyles[state.type],
          display: "flex",
          alignItems: "center",
          columns: "auto 1fr auto",
          columnGap: "100",
        }}
      >
        <Avatar size="large">
          {(props) => (
            // Note: using `div` rather than `Box`.
            // `CustomAvatarProps` passes through a `className`
            // but `Box` does not accept `className` as a prop.
            <div
              {...props}
              // Workaround to make `Avatar` not draggable.
              // Ideally `Avatar` would have a `draggable` prop.
              style={{ pointerEvents: "none" }}
              ref={props.ref as Ref<HTMLDivElement>}
            />
          )}
        </Avatar>
        <div style={{ display: "flex" }}>
          <h3>{desc}</h3>
          <h4 style={noMarginStyles}>{type}</h4>
          <h4 style={noMarginStyles}>{rate}</h4>
        </div>

        {closestEdge && (
          <DropIndicator edge={closestEdge} gap={token("space.100", "0")} />
        )}
      </div>
    );
  }
);

function Card({ item }: { item: QuoteItem }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { id } = item;
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [state, setState] = useState<CardState>(idleState);

  const actionMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const { instanceId, registerCard } = useBoardContext();
  useEffect(() => {
    if (!actionMenuTriggerRef.current) return;
    if (!ref.current) return;

    return registerCard({
      cardId: id,
      entry: {
        element: ref.current,
        actionMenuTrigger: actionMenuTriggerRef.current,
      },
    });
  }, [registerCard, id]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return combine(
      draggable({
        element: element,
        getInitialData: () => ({ type: "card", itemId: id, instanceId }),
        onGenerateDragPreview: ({ location, source, nativeSetDragImage }) => {
          const rect = source.element.getBoundingClientRect();

          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element,
              input: location.current.input,
            }),
            render({ container }) {
              setState({ type: "preview", container, rect });
              return () => setState(draggingState);
            },
          });
        },

        onDragStart: () => setState(draggingState),
        onDrop: () => setState(idleState),
      }),
      dropTargetForExternal({
        element: element,
      }),
      dropTargetForElements({
        element: element,
        canDrop: ({ source }) => {
          return (
            source.data.instanceId === instanceId && source.data.type === "card"
          );
        },
        getIsSticky: () => true,
        getData: ({ input, element }) => {
          const data = { type: "card", itemId: id };

          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["top", "bottom"],
          });
        },
        onDragEnter: (args) => {
          if (args.source.data.itemId !== id) {
            setClosestEdge(extractClosestEdge(args.self.data));
          }
        },
        onDrag: (args) => {
          if (args.source.data.itemId !== id) {
            setClosestEdge(extractClosestEdge(args.self.data));
          }
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      })
    );
  }, [instanceId, item, id]);

  return (
    <Fragment>
      <CardPrimitive
        ref={ref}
        item={item}
        state={state}
        closestEdge={closestEdge}
        actionMenuTriggerRef={actionMenuTriggerRef}
      />
      {state.type === "preview" &&
        ReactDOM.createPortal(
          <div
            style={{
              /**
               * Ensuring the preview has the same dimensions as the original.
               *
               * Using `border-box` sizing here is not necessary in this
               * specific example, but it is safer to include generally.
               */
              boxSizing: "border-box",
              width: state.rect.width,
              height: state.rect.height,
            }}
          >
            <CardPrimitive item={item} state={state} closestEdge={null} />
          </div>,
          state.container
        )}
    </Fragment>
  );
}

export default Card;
