'use strict';
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
var Variable_1 = __importDefault(require('./Variable'));
var Class_1 = __importDefault(require('./Class'));
var Scope = /** @class */ (function () {
    function Scope(parentScope) {
        this.variables = [];
        this.classes = [];
        this.parentScope = parentScope;
    }
    Scope.prototype.lookup = function (name) {
        var _a;
        return (
            this.variables.find(function (v) {
                return v.origName === name;
            }) || ((_a = this.parentScope) === null || _a === void 0 ? void 0 : _a.lookup(name))
        );
    };
    Scope.prototype.lookupClass = function (name) {
        var _a;
        return (
            this.classes.find(function (c) {
                return c.origName === name;
            }) || ((_a = this.parentScope) === null || _a === void 0 ? void 0 : _a.lookupClass(name))
        );
    };
    Scope.prototype.defineClass = function (name, scope) {
        var classDef = new Class_1.default(name, scope);
        this.classes.push(classDef);
        this.variables.push(classDef);
        return classDef;
    };
    Scope.prototype.defineVariable = function (name, instanceOfName) {
        var instanceOf = instanceOfName ? this.lookupClass(instanceOfName) : undefined;
        var varDef = new Variable_1.default(name, instanceOf);
        this.variables.push(varDef);
        return varDef;
    };
    Scope.prototype.rename = function (oldName, newName) {
        var v = this.lookup(oldName);
        if (v === undefined) {
            throw new Error('Variable ' + oldName + ' does not exist and can not be renamed.');
        } else {
            return v.rename(newName);
        }
    };
    Scope.prototype.renameField = function (instanceOf, oldName, newName) {
        // Rename declaration
        var instanceOfClass = this.lookupClass(instanceOf);
        if (instanceOfClass === undefined) {
            throw new Error(
                'Class ' +
                    instanceOf +
                    ' does not exist, and we can therefore not rename ' +
                    oldName +
                    ' to ' +
                    newName,
            );
        }
        var fieldDecl = instanceOfClass.lookup(oldName);
        if (fieldDecl === undefined) {
            throw new Error('Field ' + oldName + ' does not exist on class ' + instanceOf);
        }
        fieldDecl.rename(newName);
        // TODO: Rename references
        // const field = instanceOfClass.instancesOfMe.find(el => el.origName === oldName);
        // if(field === undefined) {
        //     throw new Error(`Field ${oldName} does not exist on class ${instanceOf}`);
        // }
        // field.rename(newName);
    };
    Scope.prototype.toString = function () {
        return this.variables
            .map(function (v) {
                var _a;
                return v.name + ': ' + ((_a = v.instanceOf) === null || _a === void 0 ? void 0 : _a.name);
            })
            .join('\n');
    };
    return Scope;
})();
exports.default = Scope;
