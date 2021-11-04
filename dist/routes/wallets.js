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
exports.walletFromUsername = exports.getWalletBalance = exports.prepareWallet = exports.createWallet = void 0;
const signer_1 = require("@taquito/signer");
const taquito_1 = require("@taquito/taquito");
const bip39_1 = require("bip39");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const libsodium_wrappers_sumo_1 = __importDefault(require("libsodium-wrappers-sumo"));
const constants_1 = require("@shared/constants");
const constants_2 = require("@utilities/constants");
const crypto_1 = require("@utilities/crypto");
function createWallet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username } = req.body;
        if (!username) {
            return res.status(http_status_codes_1.default.BAD_REQUEST).json({
                error: constants_1.paramMissingError,
            });
        }
        const wallet = yield (0, exports.walletFromUsername)(username);
        return res.status(http_status_codes_1.default.OK).json({
            pk: wallet.publicKey,
            pkh: wallet.address,
        });
    });
}
exports.createWallet = createWallet;
function prepareWallet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { address, amount } = req.body;
        const tezos = new taquito_1.TezosToolkit(process.env.BLOCKCHAIN_RPC_URL);
        tezos.setSignerProvider(yield signer_1.InMemorySigner.fromSecretKey(constants_2.contract.ADMIN_SECRET_KEY));
        const operation = yield tezos.wallet.transfer({ to: address, amount: Number(amount) }).send();
        yield operation.confirmation();
        return res.status(http_status_codes_1.default.NO_CONTENT).end();
    });
}
exports.prepareWallet = prepareWallet;
function getWalletBalance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            return res.status(http_status_codes_1.default.BAD_REQUEST).json({
                error: constants_1.paramMissingError,
            });
        }
        try {
            const tezos = new taquito_1.TezosToolkit(process.env.BLOCKCHAIN_RPC_URL);
            const balance = yield tezos.tz.getBalance(id);
            res.status(http_status_codes_1.default.OK).end(`${balance.toNumber() / 1000000}`);
        }
        catch (error) {
            console.error(JSON.stringify(error));
            res.status(500).end();
        }
    });
}
exports.getWalletBalance = getWalletBalance;
const walletFromUsername = (username) => __awaiter(void 0, void 0, void 0, function* () {
    yield libsodium_wrappers_sumo_1.default.ready;
    const s = yield (0, bip39_1.mnemonicToSeed)(username, 'pasà9876ug/ordoaipjvizeuohjzàiojez').then(seed => seed.slice(0, 32));
    const kp = libsodium_wrappers_sumo_1.default.crypto_sign_seed_keypair(new Uint8Array(s));
    return {
        username,
        secretKey: (0, crypto_1.b58cencode)(kp.privateKey, constants_2.prefix.edsk),
        publicKey: (0, crypto_1.b58cencode)(kp.publicKey, constants_2.prefix.edpk),
        address: (0, crypto_1.b58cencode)(libsodium_wrappers_sumo_1.default.crypto_generichash(20, kp.publicKey), constants_2.prefix.tz1),
    };
});
exports.walletFromUsername = walletFromUsername;
