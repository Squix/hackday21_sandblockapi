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
exports.requestNft = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const _server_1 = require("@server");
const constants_1 = require("@shared/constants");
const constants_2 = require("@utilities/constants");
const contract_1 = require("../nft/contract");
//get a nft
const getFactory = (address, secretKey) => contract_1.NFTFactory.create({
    providerUrl: process.env.BLOCKCHAIN_RPC_URL,
    address: constants_2.contract.ADMIN_ADDRESS,
    secretKey: constants_2.contract.ADMIN_SECRET_KEY,
});
const getFactoryWithContract = (address, secretKey) => __awaiter(void 0, void 0, void 0, function* () { return (yield getFactory(address, secretKey)).withContract(constants_2.contract.CONTRACT_ADDRESS, constants_2.contract.LAMBDA_CONTRACT_ADDRESS); });
function requestNft(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(req.body);
        const { secret, user_public_key } = req.body;
        if (!secret) {
            return res.status(http_status_codes_1.default.BAD_REQUEST).json({
                error: constants_1.paramMissingError,
            });
        }
        const secret_table = _server_1.db.getData('/secret_to_nft');
        console.log(secret_table);
        if (!secret_table[secret] || secret_table[secret].winner) {
            return res.status(http_status_codes_1.default.BAD_REQUEST).json({
                error: "secret is invalid or already used",
            });
        }
        //si c'est bon, on fait le transfer
        const contractFact = yield getFactoryWithContract(constants_2.contract.CONTRACT_ADDRESS, constants_2.contract.ADMIN_SECRET_KEY);
        //await contractFact.transfer([{owner: contract.ADMIN_ADDRESS, tokens: [<number>secret_table[secret].nft_address, user_public_key}]}])
        //on
        res.status(200).json({
            "nft_address": secret_table[secret].nft_address
        });
        /* const tezos = new TezosToolkit(<string>process.env.BLOCKCHAIN_RPC_URL);
     
        try {
            const balance = await tezos.tz
            .getBalance(id)
            res.status(OK).end(`${balance.toNumber() / 1000000}`);
        } catch (error) {
         console.error(JSON.stringify(error))
         res.status(500).end()
        } */
    });
}
exports.requestNft = requestNft;
