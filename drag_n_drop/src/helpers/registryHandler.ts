import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";

export type CardEntry = {
  element: HTMLElement;
  actionMenuTrigger: HTMLElement;
};

export type ColumnEntry = {
  element: HTMLElement;
};

export function createRegistry() {
  const cards = new Map<string, CardEntry>();
  const columns = new Map<string, ColumnEntry>();

  function registerCard({
    cardId,
    entry,
  }: {
    cardId: string;
    entry: CardEntry;
  }): CleanupFn {
    cards.set(cardId, entry);
    return function cleanup() {
      cards.delete(cardId);
    };
  }

  function registerColumn({
    columnId,
    entry,
  }: {
    columnId: string;
    entry: ColumnEntry;
  }): CleanupFn {
    columns.set(columnId, entry);
    return function cleanup() {
      cards.delete(columnId);
    };
  }

  function getCard(cardId: string): CardEntry {
    const entry = cards.get(cardId);
    if (!entry) throw "no entry card";
    return entry;
  }

  function getColumn(columnId: string): ColumnEntry {
    const entry = columns.get(columnId);
    if (!entry) throw "no entry column";
    return entry;
  }

  return { registerCard, registerColumn, getCard, getColumn };
}
