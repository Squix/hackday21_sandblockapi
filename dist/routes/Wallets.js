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
exports.getWalletBalance = exports.createWallet = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const constants_1 = require("@shared/constants");
const { BAD_REQUEST, CREATED, OK } = http_status_codes_1.default;
const taquito_1 = require("@taquito/taquito");
const signer_1 = require("@taquito/signer");
const bip39_1 = require("bip39");
const libsodium_wrappers_sumo_1 = __importDefault(require("libsodium-wrappers-sumo"));
const crypto_1 = require("../utilities/crypto");
const constants_2 = require("../utilities/constants");
/**
 * Create a wallet
 *
 * @param req
 * @param res
 * @returns
 */
function createWallet(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username } = req.body;
        if (!username) {
            return res.status(BAD_REQUEST).json({
                error: constants_1.paramMissingError,
            });
        }
        console.log('username', username);
        const tezos = new taquito_1.TezosToolkit(process.env.BLOCKCHAIN_RPC_URL);
        const generatedKey = yield generateKeys(username, 'pasà9876ug/ordoaipjvizeuohjzàiojez');
        tezos.setSignerProvider(yield signer_1.InMemorySigner.fromSecretKey(generatedKey.sk));
        /* //on le signale à la blockchain
    
        try {
            const operation = await tezos.tz.activate(generatedKey.pkh, "161d907951bf5594bedb1d70bb03c938d63c22be")
            await operation.confirmation()
            return res.status(OK).json(generatedKey);
          } catch (e) {
            console.log(e)
            return res.status(500).end()
          } */
        return res.status(OK).json(generatedKey);
    });
}
exports.createWallet = createWallet;
function getWalletBalance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(req.params);
        const { id } = req.params;
        if (!id) {
            return res.status(BAD_REQUEST).json({
                error: constants_1.paramMissingError,
            });
        }
        const tezos = new taquito_1.TezosToolkit(process.env.BLOCKCHAIN_RPC_URL);
        try {
            const balance = yield tezos.tz
                .getBalance(id);
            res.status(OK).end(`${balance.toNumber() / 1000000}`);
        }
        catch (error) {
            console.error(JSON.stringify(error));
            res.status(500).end();
        }
    });
}
exports.getWalletBalance = getWalletBalance;
//fonction qui génère un nouveau wallet
const generateKeys = (mnemonic, passphrase) => __awaiter(void 0, void 0, void 0, function* () {
    yield libsodium_wrappers_sumo_1.default.ready;
    const s = yield (0, bip39_1.mnemonicToSeed)(mnemonic, passphrase).then((seed) => seed.slice(0, 32));
    const kp = libsodium_wrappers_sumo_1.default.crypto_sign_seed_keypair(new Uint8Array(s));
    return {
        mnemonic,
        passphrase,
        sk: (0, crypto_1.b58cencode)(kp.privateKey, constants_2.prefix.edsk),
        pk: (0, crypto_1.b58cencode)(kp.publicKey, constants_2.prefix.edpk),
        pkh: (0, crypto_1.b58cencode)(libsodium_wrappers_sumo_1.default.crypto_generichash(20, kp.publicKey), constants_2.prefix.tz1),
    };
});
