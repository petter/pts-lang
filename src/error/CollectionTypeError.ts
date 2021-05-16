export default class CollectionTypeError {
    type = 'CollectionTypeError';
    collection: string;
    error: string;

    get message(): string {
        return `CollectionTypeError in collection ${this.collection}:\n` + this.error;
    }

    constructor(collection: string, errorMessage: string) {
        this.collection = collection;
        this.error = errorMessage;
    }

    toString() {
        return this.message;
    }
}
