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

type ColumnType = {
  title: string;
  columnId: string;
  items: QuoteItem[];
};

type ColumnMap = { [columnId: string]: ColumnType };

type KeyboardOperation =
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

type BoardState = {
  columnMap: ColumnMap;
  orderedColumnIds: string[];
  lastKeyboardOperation: KeyboardOperation | null;
};

type BoardContextProps = {
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
    actionMenuTrigger: HTMLElement;
  }) => void;
  instanceId: symbol;
};

export type {
  KeyboardOperation,
  BoardState,
  ColumnMap,
  QuoteItem,
  Charges,
  ColumnType,
  BoardContextProps,
};
