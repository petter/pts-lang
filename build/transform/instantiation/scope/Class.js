"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Variable_1 = __importDefault(require("./Variable"));
var Class = /** @class */ (function (_super) {
    __extends(Class, _super);
    function Class(name, scope) {
        var _this = _super.call(this, name, undefined) || this;
        _this.instancesOfMe = [];
        _this.childClasses = [];
        _this.scope = scope;
        _this.instanceOf = _this;
        return _this;
    }
    Class.prototype.lookup = function (name) {
        var _a;
        return this.scope.lookup(name) || ((_a = this.superClass) === null || _a === void 0 ? void 0 : _a.lookup(name));
    };
    Class.prototype.addSuperClass = function (superClass) {
        this.superClass = superClass;
        superClass.addChildClass(this);
        return this;
    };
    Class.prototype.addInstanceOfMe = function (v) {
        this.instancesOfMe.push(v);
        return this;
    };
    Class.prototype.addChildClass = function (c) {
        this.childClasses.push(c);
        return this;
    };
    return Class;
}(Variable_1.default));
exports.default = Class;
