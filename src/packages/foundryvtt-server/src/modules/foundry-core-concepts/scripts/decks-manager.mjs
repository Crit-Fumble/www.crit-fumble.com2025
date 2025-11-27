/**
 * Decks Manager
 *
 * Manages decks (card collections) and hands (player card subsets).
 * Integrates with FoundryVTT Cards/Compendiums and extends functionality.
 */

const MODULE_ID = 'foundry-core-concepts';

export class DecksManager {
  constructor() {
    this.decks = new Map();
    this.hands = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the decks manager
   */
  async initialize() {
    console.log('Decks Manager | Initializing...');

    // Load decks from Cards documents and compendiums
    await this.loadDecks();

    // Load player hands
    await this.loadHands();

    // Register hooks
    this.registerHooks();

    this.initialized = true;
    console.log('Decks Manager | Ready');
  }

  /**
   * Load decks from Cards documents and compendiums
   */
  async loadDecks() {
    // Load active decks (Cards documents in the world)
    for (const deck of game.cards) {
      this.decks.set(deck.id, {
        id: deck.id,
        name: deck.name,
        type: 'active',
        cards: deck,
        source: 'world'
      });
    }

    // Load compendium decks
    for (const pack of game.packs) {
      if (pack.documentName === 'Cards') {
        const documents = await pack.getDocuments();
        for (const deck of documents) {
          this.decks.set(`${pack.collection}.${deck.id}`, {
            id: deck.id,
            name: deck.name,
            type: 'compendium',
            cards: deck,
            source: pack.collection
          });
        }
      }
    }

    console.log(`Decks Manager | Loaded ${this.decks.size} decks`);
  }

  /**
   * Load player hands
   */
  async loadHands() {
    // Hands are stored as flags on user documents
    for (const user of game.users) {
      const handCards = user.getFlag(MODULE_ID, 'hand') || [];
      this.hands.set(user.id, {
        userId: user.id,
        userName: user.name,
        cards: handCards
      });
    }

    console.log(`Decks Manager | Loaded ${this.hands.size} player hands`);
  }

  /**
   * Create a deck from a compendium
   */
  async createDeckFromCompendium(compendiumId, deckName) {
    const pack = game.packs.get(compendiumId);
    if (!pack || pack.documentName !== 'Cards') {
      ui.notifications.warn('Invalid compendium or not a Cards compendium');
      return null;
    }

    // Get all cards from compendium
    const compendiumCards = await pack.getDocuments();
    if (compendiumCards.length === 0) {
      ui.notifications.warn('Compendium is empty');
      return null;
    }

    // Create a new Cards document in the world
    const deckData = {
      name: deckName || `Deck from ${pack.title}`,
      type: compendiumCards[0].type,
      cards: compendiumCards.map(c => c.toObject())
    };

    const newDeck = await Cards.create(deckData);

    // Add to our registry
    this.decks.set(newDeck.id, {
      id: newDeck.id,
      name: newDeck.name,
      type: 'active',
      cards: newDeck,
      source: 'world'
    });

    ui.notifications.info(`Created deck "${deckName}" from compendium`);
    console.log(`Decks Manager | Created deck from compendium: ${deckName}`);
    return newDeck;
  }

  /**
   * Draw cards from a deck to a player's hand
   */
  async drawCards(deckId, userId, count = 1) {
    const deck = this.decks.get(deckId);
    if (!deck || deck.type !== 'active') {
      ui.notifications.warn('Deck not found or not active');
      return [];
    }

    const user = game.users.get(userId);
    if (!user) {
      ui.notifications.warn('User not found');
      return [];
    }

    // Draw from the Cards document
    const drawnCards = await deck.cards.deal([userId], count);

    // Update hand
    const hand = this.hands.get(userId) || { userId, userName: user.name, cards: [] };
    hand.cards.push(...drawnCards.map(c => c.id));
    await user.setFlag(MODULE_ID, 'hand', hand.cards);

    this.hands.set(userId, hand);

    ui.notifications.info(`Drew ${count} card(s) from ${deck.name}`);
    console.log(`Decks Manager | User ${user.name} drew ${count} cards from ${deck.name}`);
    return drawnCards;
  }

  /**
   * Play a card from hand
   */
  async playCard(userId, cardId) {
    const user = game.users.get(userId);
    if (!user) {
      ui.notifications.warn('User not found');
      return;
    }

    const hand = this.hands.get(userId);
    if (!hand || !hand.cards.includes(cardId)) {
      ui.notifications.warn('Card not in hand');
      return;
    }

    // Find the card in any deck
    let card = null;
    let parentDeck = null;

    for (const deck of this.decks.values()) {
      if (deck.type === 'active') {
        card = deck.cards.cards.get(cardId);
        if (card) {
          parentDeck = deck.cards;
          break;
        }
      }
    }

    if (!card) {
      ui.notifications.warn('Card not found in any deck');
      return;
    }

    // Remove from hand
    hand.cards = hand.cards.filter(id => id !== cardId);
    await user.setFlag(MODULE_ID, 'hand', hand.cards);
    this.hands.set(userId, hand);

    // Play the card (pass to discard or specific pile)
    await parentDeck.pass(card, { action: 'play' });

    ui.notifications.info(`Played card: ${card.name}`);
    console.log(`Decks Manager | User ${user.name} played card: ${card.name}`);

    // Trigger hook for other systems
    Hooks.callAll('coreConcepts.cardPlayed', userId, card);

    return card;
  }

  /**
   * Discard a card from hand
   */
  async discardCard(userId, cardId) {
    const user = game.users.get(userId);
    if (!user) {
      ui.notifications.warn('User not found');
      return;
    }

    const hand = this.hands.get(userId);
    if (!hand || !hand.cards.includes(cardId)) {
      ui.notifications.warn('Card not in hand');
      return;
    }

    // Find the card
    let card = null;
    let parentDeck = null;

    for (const deck of this.decks.values()) {
      if (deck.type === 'active') {
        card = deck.cards.cards.get(cardId);
        if (card) {
          parentDeck = deck.cards;
          break;
        }
      }
    }

    if (!card) {
      ui.notifications.warn('Card not found in any deck');
      return;
    }

    // Remove from hand
    hand.cards = hand.cards.filter(id => id !== cardId);
    await user.setFlag(MODULE_ID, 'hand', hand.cards);
    this.hands.set(userId, hand);

    // Discard the card
    await parentDeck.pass(card, { action: 'discard' });

    ui.notifications.info(`Discarded card: ${card.name}`);
    console.log(`Decks Manager | User ${user.name} discarded card: ${card.name}`);

    return card;
  }

  /**
   * Get a player's hand
   */
  getHand(userId) {
    return this.hands.get(userId);
  }

  /**
   * Get all active decks
   */
  getActiveDecks() {
    return Array.from(this.decks.values()).filter(d => d.type === 'active');
  }

  /**
   * Get all compendium decks
   */
  getCompendiumDecks() {
    return Array.from(this.decks.values()).filter(d => d.type === 'compendium');
  }

  /**
   * Get deck by ID
   */
  getDeck(deckId) {
    return this.decks.get(deckId);
  }

  /**
   * Register hooks for deck/hand system
   */
  registerHooks() {
    // Reload decks when cards are created/updated/deleted
    Hooks.on('createCards', () => this.loadDecks());
    Hooks.on('updateCards', () => this.loadDecks());
    Hooks.on('deleteCards', () => this.loadDecks());

    // Add UI controls for hands (example)
    Hooks.on('renderPlayerList', (app, html) => {
      // Could add hand display here
    });
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.decks.clear();
    this.hands.clear();
    this.initialized = false;
  }
}
