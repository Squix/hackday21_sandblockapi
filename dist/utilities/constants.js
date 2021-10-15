"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contract = exports.admin_passphrase = exports.prefix = void 0;
exports.prefix = {
    tz1: new Uint8Array([6, 161, 159]),
    edsk: new Uint8Array([43, 246, 78, 7]),
    edpk: new Uint8Array([13, 15, 37, 217])
};
exports.admin_passphrase = "thisismyadminpassphrase";
exports.contract = {
    ADMIN_ADDRESS: process.env.ADMIN_ADDRESS,
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    LAMBDA_CONTRACT_ADDRESS: process.env.LAMBDA_ADDRESS
};
exports.default = {
    prefix: exports.prefix
};
