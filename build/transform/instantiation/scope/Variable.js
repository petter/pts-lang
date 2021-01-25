"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Variable = /** @class */ (function () {
    function Variable(name, instanceOf) {
        this.name = name;
        this.origName = name;
        this.instanceOf = instanceOf;
        if (instanceOf)
            instanceOf.addInstanceOfMe(this);
    }
    Variable.prototype.rename = function (newName) {
        this.name = newName;
        return this;
    };
    Variable.prototype.toString = function () {
        return this.name;
    };
    return Variable;
}());
exports.default = Variable;
