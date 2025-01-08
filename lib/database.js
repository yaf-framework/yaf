const { generateUniqueId } = require("./utils");

class InMemoryDatabase {
  constructor() {
    this.db = new Map(); // Use Map for better performance with large datasets
    this.transactions = []; // Stack for nested transactions
  }

  beginTransaction() {
    const transaction = { id: generateUniqueId(), changes: new Map() };
    this.transactions.push(transaction);
    return transaction.id;
  }

  commitTransaction(id) {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const transaction = this.transactions[index];
    for (const [key, value] of transaction.changes) {
      this.db.set(key, value); // Apply changes to the main database
    }

    this.transactions.splice(index, 1); // Remove the committed transaction
  }

  rollbackTransaction(id) {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    // Revert changes by restoring the original state
    const transaction = this.transactions[index];
    for (const [key, value] of transaction.changes) {
      if (value === null) {
        this.db.delete(key); // If the value was deleted, remove it
      } else {
        this.db.set(key, value); // Otherwise, restore the original value
      }
    }

    this.transactions.splice(index, 1); // Remove the rolled-back transaction
  }

  set(key, value) {
    if (this.transactions.length > 0) {
      const currentTransaction = this.transactions[this.transactions.length - 1];
      if (!currentTransaction.changes.has(key)) {
        // Store the original value for rollback
        currentTransaction.changes.set(key, this.db.get(key) || null);
      }
    }
    this.db.set(key, value);
  }

  get(key) {
    return this.db.get(key);
  }

  delete(key) {
    if (this.transactions.length > 0) {
      const currentTransaction = this.transactions[this.transactions.length - 1];
      if (!currentTransaction.changes.has(key)) {
        // Store the original value for rollback
        currentTransaction.changes.set(key, this.db.get(key) || null);
      }
    }
    this.db.delete(key);
  }
}

module.exports = { InMemoryDatabase };
