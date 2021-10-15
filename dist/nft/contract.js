"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTFactory = exports.RemoveOperator = exports.AddOperator = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const taquito_1 = require("@taquito/taquito");
const signer_1 = require("@taquito/signer");
const bignumber_js_1 = require("bignumber.js");
const tzip12_1 = require("@taquito/tzip12");
const utils_1 = require("@taquito/utils");
const originateContract = (ctx) => (ownerAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const code = (yield (0, util_1.promisify)(fs_1.default.readFile)(path_1.default.join(__dirname, "./contract.tz"))).toString();
    const metadata = new taquito_1.MichelsonMap();
    metadata.set("", (0, utils_1.char2Bytes)("tezos-storage:contents"));
    metadata.set("contents", (0, utils_1.char2Bytes)(JSON.stringify({ "version": "v0.1.0", "name": "test", "authors": ["Fabernovel"], "interfaces": ["TZIP-012", "TZIP-016"] })));
    const storage = {
        ledger: new taquito_1.MichelsonMap(),
        operators: new taquito_1.MichelsonMap(),
        reverse_ledger: new taquito_1.MichelsonMap(),
        metadata: metadata,
        token_metadata: new taquito_1.MichelsonMap(),
        last_token_id: new bignumber_js_1.BigNumber(0),
        admin: ownerAddress,
    };
    const origParam = { code, storage };
    const originationOp = yield ctx.toolkit.contract.originate(origParam);
    yield originationOp.confirmation();
    const contract = yield originationOp.contract();
    return contract;
});
const mint = (ctx) => (metadata, ownerAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const mintOp = ctx.contract.methods.mint;
    const res = yield mintOp((0, utils_1.char2Bytes)(JSON.stringify(metadata)), ownerAddress).send();
    // Let's dig inside the response and guess where the last_token_id value is stored 🤷
    const token_id = res.results[0].metadata.operation_result.storage.args[0].args[0].args[1]['int'];
    yield res.confirmation();
    return token_id;
});
const burn = (ctx) => (tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield ctx.contract.methods.burn(tokenId).send();
    yield res.confirmation();
});
const balanceOf = (ctx) => (params) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield ctx.contract.views.balance_of(params.map(q => ({ owner: q.owner, token_id: q.tokenId }))).read(ctx.lambdaContractAddress);
    return result.map(res => ({
        owner: res.request.owner,
        tokenId: res.request.token_id.toNumber(),
        owned: res.balance.toNumber() === 1,
    }));
});
const transfer = (ctx) => (params) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield ctx.contract.methods.transfer(params.map(param => ({
        from_: param.owner,
        txs: param.tokens.map(token => ({ to_: token.to, token_id: token.tokenId, amount: 1 })),
    }))).send();
    yield result.confirmation();
});
const AddOperator = (operator, tokenId) => ({ operator, tokenId, action: 'Add' });
exports.AddOperator = AddOperator;
const RemoveOperator = (operator, tokenId) => ({ operator, tokenId, action: 'Remove' });
exports.RemoveOperator = RemoveOperator;
const updateOperators = (ctx) => (ops) => __awaiter(void 0, void 0, void 0, function* () {
    const op = yield ctx.contract.methods.update_operators(ops.map(update => ({
        [update.action === 'Add' ? 'add_operator' : 'remove_operator']: {
            "owner": ctx.address,
            "operator": update.operator,
            "token_id": update.tokenId,
        }
    }))).send();
    yield op.confirmation();
});
const addOperator = (ctx) => (operator, tokenId) => updateOperators(ctx)([(0, exports.AddOperator)(operator, tokenId)]);
const removeOperator = (ctx) => (operator, tokenId) => updateOperators(ctx)([(0, exports.RemoveOperator)(operator, tokenId)]);
const getTokenInfo = (ctx) => (tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    const storage = yield ctx.contract.storage();
    const metadata = storage.token_metadata;
    const tokenInfoMap = yield metadata.get(tokenId);
    if (tokenInfoMap === undefined) {
        return undefined;
    }
    return JSON.parse((0, utils_1.bytes2Char)(tokenInfoMap.token_info.get('')));
});
const getOwner = (ctx) => (tokenId) => __awaiter(void 0, void 0, void 0, function* () {
    const storage = yield ctx.contract.storage();
    const ledger = storage.ledger;
    return ledger.get(tokenId);
});
const getOwnedTokens = (ctx) => (account) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const storage = yield ctx.contract.storage();
    const reverseLedger = storage.reverse_ledger;
    const tokenIds = yield reverseLedger.get(account);
    return (_a = tokenIds === null || tokenIds === void 0 ? void 0 : tokenIds.map(id => id.toNumber())) !== null && _a !== void 0 ? _a : [];
});
exports.NFTFactory = {
    /** Create a NFTFactory instance for a given blockchain address and a given account */
    create: (config) => __awaiter(void 0, void 0, void 0, function* () {
        const toolkit = new taquito_1.TezosToolkit(config.providerUrl);
        toolkit.addExtension(new tzip12_1.Tzip12Module());
        toolkit.setPackerProvider(new taquito_1.MichelCodecPacker());
        toolkit.setSignerProvider(yield signer_1.InMemorySigner.fromSecretKey(config.secretKey));
        const ctx = {
            toolkit: toolkit,
            address: config.address,
        };
        return {
            originateContract: originateContract(ctx),
            createLambdaContract: () => __awaiter(void 0, void 0, void 0, function* () {
                const op = yield toolkit.contract.originate({
                    code: taquito_1.VIEW_LAMBDA.code,
                    storage: taquito_1.VIEW_LAMBDA.storage,
                });
                const lambdaContract = yield op.contract();
                return lambdaContract.address;
            }),
            withContract: (contractAddress, lambdaContractAddress) => __awaiter(void 0, void 0, void 0, function* () {
                const contract = yield toolkit.contract.at(contractAddress, tzip12_1.tzip12);
                const ctxWithContract = Object.assign(Object.assign({}, ctx), { contract: contract, lambdaContractAddress });
                return {
                    mint: mint(ctxWithContract),
                    burn: burn(ctxWithContract),
                    balanceOf: balanceOf(ctxWithContract),
                    transfer: transfer(ctxWithContract),
                    updateOperators: updateOperators(ctxWithContract),
                    addOperator: addOperator(ctxWithContract),
                    removeOperator: removeOperator(ctxWithContract),
                    getTokenInfo: getTokenInfo(ctxWithContract),
                    getOwner: getOwner(ctxWithContract),
                    getOwnedTokens: getOwnedTokens(ctxWithContract),
                };
            })
        };
    }),
};
exports.default = exports.NFTFactory;
