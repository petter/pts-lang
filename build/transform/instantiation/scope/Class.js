"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Variable_1 = __importDefault(require("./Variable"));
class Class extends Variable_1.default {
    constructor(name, scope) {
        super(name, undefined);
        this.instancesOfMe = [];
        this.childClasses = [];
        this.scope = scope;
        this.instanceOf = this;
    }
    lookup(name) {
        return this.scope.lookup(name) || this.superClass?.lookup(name);
    }
    addSuperClass(superClass) {
        this.superClass = superClass;
        superClass.addChildClass(this);
        return this;
    }
    addInstanceOfMe(v) {
        this.instancesOfMe.push(v);
        return this;
    }
    addChildClass(c) {
        this.childClasses.push(c);
        return this;
    }
}
exports.default = Class;
