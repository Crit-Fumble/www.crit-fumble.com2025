/**
 * Books Manager
 *
 * Manages enhanced books that can contain rules, cards, tables, and other data.
 * Extends JournalEntry with additional functionality for structured content.
 */

import { InputValidator, PermissionGuard } from './validators.mjs';

const MODULE_ID = 'foundry-core-concepts';

// TODO: Consider using JournalEntryPage subtypes for better structure
// TODO: Add visual book editor with ApplicationV2
export class BooksManager {
  constructor() {
    this.books = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the books manager
   */
  async initialize() {
    if (!game.settings.get(MODULE_ID, 'enableBooks')) {
      console.log('Books Manager | Disabled in settings');
      return;
    }

    console.log('Books Manager | Initializing...');

    // Load books from journal entries
    await this.loadBooks();

    // Register hooks
    this.registerHooks();

    this.initialized = true;
    console.log('Books Manager | Ready');
  }

  /**
   * Load books from journal entries
   */
  async loadBooks() {
    // Look for journal entries marked as books
    const bookEntries = game.journal.filter(j => j.getFlag(MODULE_ID, 'isBook'));

    for (const entry of bookEntries) {
      const bookData = {
        id: entry.id,
        name: entry.name,
        journal: entry,
        linkedCards: entry.getFlag(MODULE_ID, 'linkedCards') || [],
        linkedTables: entry.getFlag(MODULE_ID, 'linkedTables') || [],
        linkedRules: entry.getFlag(MODULE_ID, 'linkedRules') || [],
        linkedActors: entry.getFlag(MODULE_ID, 'linkedActors') || [],
        linkedItems: entry.getFlag(MODULE_ID, 'linkedItems') || [],
        metadata: entry.getFlag(MODULE_ID, 'bookMetadata') || {}
      };

      this.books.set(entry.id, bookData);
      console.log(`Books Manager | Loaded book: ${bookData.name}`);
    }

    console.log(`Books Manager | Loaded ${this.books.size} books`);
  }

  /**
   * Create a new book
   */
  async createBook(name, options = {}) {
    // Security: Permission check
    PermissionGuard.requireGM('create books');

    // Security: Input validation
    InputValidator.validateEntityName(name, 'Book');

    const journalData = {
      name: name,
      flags: {
        [MODULE_ID]: {
          isBook: true,
          linkedCards: options.linkedCards || [],
          linkedTables: options.linkedTables || [],
          linkedRules: options.linkedRules || [],
          linkedActors: options.linkedActors || [],
          linkedItems: options.linkedItems || [],
          bookMetadata: {
            author: options.author || game.user.name,
            version: options.version || '1.0.0',
            description: options.description || '',
            tags: options.tags || []
          }
        }
      }
    };

    const journal = await JournalEntry.create(journalData);

    const bookData = {
      id: journal.id,
      name: name,
      journal: journal,
      linkedCards: options.linkedCards || [],
      linkedTables: options.linkedTables || [],
      linkedRules: options.linkedRules || [],
      linkedActors: options.linkedActors || [],
      linkedItems: options.linkedItems || [],
      metadata: journalData.flags[MODULE_ID].bookMetadata
    };

    this.books.set(journal.id, bookData);

    ui.notifications.info(`Created book: ${name}`);
    console.log(`Books Manager | Created book: ${name}`);
    return bookData;
  }

  /**
   * Link a card to a book
   */
  async linkCard(bookId, cardId) {
    const book = this.books.get(bookId);
    if (!book) {
      ui.notifications.warn(`Book ${bookId} not found`);
      return;
    }

    const linkedCards = [...book.linkedCards, cardId];
    await book.journal.setFlag(MODULE_ID, 'linkedCards', linkedCards);

    book.linkedCards = linkedCards;
    console.log(`Books Manager | Linked card ${cardId} to book ${book.name}`);
  }

  /**
   * Link a table to a book
   */
  async linkTable(bookId, tableId) {
    const book = this.books.get(bookId);
    if (!book) {
      ui.notifications.warn(`Book ${bookId} not found`);
      return;
    }

    const linkedTables = [...book.linkedTables, tableId];
    await book.journal.setFlag(MODULE_ID, 'linkedTables', linkedTables);

    book.linkedTables = linkedTables;
    console.log(`Books Manager | Linked table ${tableId} to book ${book.name}`);
  }

  /**
   * Link a rule to a book
   */
  async linkRule(bookId, ruleId) {
    const book = this.books.get(bookId);
    if (!book) {
      ui.notifications.warn(`Book ${bookId} not found`);
      return;
    }

    const linkedRules = [...book.linkedRules, ruleId];
    await book.journal.setFlag(MODULE_ID, 'linkedRules', linkedRules);

    book.linkedRules = linkedRules;
    console.log(`Books Manager | Linked rule ${ruleId} to book ${book.name}`);
  }

  /**
   * Link an actor to a book
   */
  async linkActor(bookId, actorId) {
    const book = this.books.get(bookId);
    if (!book) {
      ui.notifications.warn(`Book ${bookId} not found`);
      return;
    }

    const linkedActors = [...book.linkedActors, actorId];
    await book.journal.setFlag(MODULE_ID, 'linkedActors', linkedActors);

    book.linkedActors = linkedActors;
    console.log(`Books Manager | Linked actor ${actorId} to book ${book.name}`);
  }

  /**
   * Link an item to a book
   */
  async linkItem(bookId, itemId) {
    const book = this.books.get(bookId);
    if (!book) {
      ui.notifications.warn(`Book ${bookId} not found`);
      return;
    }

    const linkedItems = [...book.linkedItems, itemId];
    await book.journal.setFlag(MODULE_ID, 'linkedItems', linkedItems);

    book.linkedItems = linkedItems;
    console.log(`Books Manager | Linked item ${itemId} to book ${book.name}`);
  }

  /**
   * Get all linked content for a book
   */
  async getBookContents(bookId) {
    const book = this.books.get(bookId);
    if (!book) return null;

    const contents = {
      book: book,
      cards: await this.resolveCards(book.linkedCards),
      tables: await this.resolveTables(book.linkedTables),
      rules: await this.resolveRules(book.linkedRules),
      actors: await this.resolveActors(book.linkedActors),
      items: await this.resolveItems(book.linkedItems)
    };

    return contents;
  }

  /**
   * Resolve card references
   */
  async resolveCards(cardIds) {
    const cards = [];
    for (const id of cardIds) {
      const card = game.cards?.get(id);
      if (card) cards.push(card);
    }
    return cards;
  }

  /**
   * Resolve table references
   */
  async resolveTables(tableIds) {
    const tables = [];
    for (const id of tableIds) {
      const table = game.tables?.get(id);
      if (table) tables.push(table);
    }
    return tables;
  }

  /**
   * Resolve rule references
   */
  async resolveRules(ruleIds) {
    // Rules are stored as journal entries with a flag
    const rules = [];
    for (const id of ruleIds) {
      const rule = game.journal?.get(id);
      if (rule && rule.getFlag(MODULE_ID, 'isRule')) {
        rules.push(rule);
      }
    }
    return rules;
  }

  /**
   * Resolve actor references
   */
  async resolveActors(actorIds) {
    const actors = [];
    for (const id of actorIds) {
      const actor = game.actors?.get(id);
      if (actor) actors.push(actor);
    }
    return actors;
  }

  /**
   * Resolve item references
   */
  async resolveItems(itemIds) {
    const items = [];
    for (const id of itemIds) {
      const item = game.items?.get(id);
      if (item) items.push(item);
    }
    return items;
  }

  /**
   * Get book by ID
   */
  getBook(bookId) {
    return this.books.get(bookId);
  }

  /**
   * Get all books
   */
  getAllBooks() {
    return Array.from(this.books.values());
  }

  /**
   * Register hooks for book system
   */
  registerHooks() {
    // Add context menu option to journal entries
    Hooks.on('getJournalEntrySheetHeaderButtons', (sheet, buttons) => {
      if (!game.user.isGM) return;

      const isBook = sheet.document.getFlag(MODULE_ID, 'isBook');

      if (!isBook) {
        // Add "Convert to Book" button
        buttons.unshift({
          label: 'Convert to Book',
          class: 'convert-to-book',
          icon: 'fas fa-book',
          onclick: async () => {
            await sheet.document.setFlag(MODULE_ID, 'isBook', true);
            await this.loadBooks();
            ui.notifications.info(`Converted "${sheet.document.name}" to a book`);
          }
        });
      } else {
        // Add "Manage Book" button
        buttons.unshift({
          label: 'Manage Book',
          class: 'manage-book',
          icon: 'fas fa-cog',
          onclick: () => this.showBookManagementDialog(sheet.document.id)
        });
      }
    });

    // Reload books when journals change
    Hooks.on('createJournalEntry', () => this.loadBooks());
    Hooks.on('updateJournalEntry', () => this.loadBooks());
    Hooks.on('deleteJournalEntry', () => this.loadBooks());
  }

  /**
   * Show book management dialog
   */
  async showBookManagementDialog(bookId) {
    const book = this.books.get(bookId);
    if (!book) return;

    const contents = await this.getBookContents(bookId);

    let html = '<div class="book-management">';
    html += `<h3>${book.name}</h3>`;
    html += '<p>Manage linked content for this book.</p>';
    html += '<hr>';

    // Show linked cards
    html += '<h4>Linked Cards</h4>';
    html += '<ul>';
    for (const card of contents.cards) {
      html += `<li>${card.name}</li>`;
    }
    if (contents.cards.length === 0) {
      html += '<li><em>No cards linked</em></li>';
    }
    html += '</ul>';

    // Show linked tables
    html += '<h4>Linked Tables</h4>';
    html += '<ul>';
    for (const table of contents.tables) {
      html += `<li>${table.name}</li>`;
    }
    if (contents.tables.length === 0) {
      html += '<li><em>No tables linked</em></li>';
    }
    html += '</ul>';

    // Show linked rules
    html += '<h4>Linked Rules</h4>';
    html += '<ul>';
    for (const rule of contents.rules) {
      html += `<li>${rule.name}</li>`;
    }
    if (contents.rules.length === 0) {
      html += '<li><em>No rules linked</em></li>';
    }
    html += '</ul>';

    html += '</div>';

    new Dialog({
      title: `Manage Book: ${book.name}`,
      content: html,
      buttons: {
        close: {
          label: 'Close'
        }
      }
    }).render(true);
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.books.clear();
    this.initialized = false;
  }
}
