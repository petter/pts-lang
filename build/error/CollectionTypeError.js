"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CollectionTypeError {
    constructor(collection, errorMessage) {
        this.type = 'CollectionTypeError';
        this.collection = collection;
        this.error = errorMessage;
    }
    get message() {
        return `CollectionTypeError in collection ${this.collection}:\n` + this.error;
    }
    toString() {
        return this.message;
    }
}
exports.default = CollectionTypeError;
