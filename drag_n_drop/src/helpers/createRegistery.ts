/**
 * Registering cards and their action menu trigger element,
 * so that we can restore focus to the trigger when a card moves between columns.
 */
function createRegistry() {
  const registry = {
    cards: new Map<string, { actionMenuTrigger: HTMLElement }>(),
  };

  function registerCard({
    cardId,
    actionMenuTrigger,
  }: {
    cardId: string;
    actionMenuTrigger: HTMLElement;
  }) {
    registry.cards.set(cardId, { actionMenuTrigger });
    return () => {
      registry.cards.delete(cardId);
    };
  }

  return { registry, registerCard };
}

export { createRegistry };
