import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";

type Charges =
  | "OriginCharges"
  | "FreightCharges"
  | "DestinationCharges"
  | "BrokerageCharges";

type QuoteItem = {
  id: string;
  desc: string;
  rate: number;
  type: Charges;
};

export type ColumnType = {
  title: string;
  columnId: string;
  items: QuoteItem[];
};

export type ColumnMap = { [columnId: string]: ColumnType };

type Outcome =
  | {
      type: "column-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-move";
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn: number;
    };

type Trigger = "pointer" | "keyboard";

type Operation = {
  trigger: Trigger;
  outcome: Outcome;
};

type BoardState = {
  columnMap: ColumnMap;
  orderedColumnIds: string[];
  lastOperation: Operation | null;
};

type BoardContextValue = {
  getColumns: () => ColumnType[];

  reorderColumn: (args: { startIndex: number; finishIndex: number }) => void;

  reorderCard: (args: {
    columnId: string;
    startIndex: number;
    finishIndex: number;
  }) => void;

  moveCard: (args: {
    startColumnId: string;
    finishColumnId: string;
    itemIndexInStartColumn: number;
    itemIndexInFinishColumn?: number;
  }) => void;

  registerCard: (args: {
    cardId: string;
    entry: {
      element: HTMLElement;
      actionMenuTrigger: HTMLElement;
    };
  }) => CleanupFn;

  registerColumn: (args: {
    columnId: string;
    entry: {
      element: HTMLElement;
    };
  }) => CleanupFn;

  instanceId: symbol;
};

export type {
  Outcome,
  BoardState,
  Charges,
  QuoteItem,
  Trigger,
  BoardContextValue,
};
