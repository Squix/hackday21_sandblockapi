"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.b58cencode = void 0;
const bs58check_1 = __importDefault(require("bs58check"));
const b58cencode = (payload, prefixArg) => {
    //console.log('prefixArg', prefixArg)
    const n = new Uint8Array(prefixArg.length + payload.length);
    n.set(prefixArg);
    n.set(payload, prefixArg.length);
    // @ts-ignore
    return bs58check_1.default.encode(Buffer.from(n, 'hex'));
};
exports.b58cencode = b58cencode;
exports.default = {
    b58cencode: exports.b58cencode
};
