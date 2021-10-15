"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getTokens = exports.getTokenInfo = exports.transfertToken = exports.createToken = exports.createContract = void 0;
const http_status_codes_1 = __importStar(require("http-status-codes"));
const Logger_1 = __importDefault(require("@shared/Logger"));
const contract_1 = require("../nft/contract");
const constants_1 = require("../utilities/constants");
const constants_2 = require("@shared/constants");
const { CREATED, OK, UNAUTHORIZED } = http_status_codes_1.default;
const admin = {
    address: constants_1.contract.ADMIN_ADDRESS,
    secretKey: constants_1.contract.ADMIN_SECRET_KEY
};
const getFactory = (address, secretKey) => contract_1.NFTFactory.create({
    providerUrl: process.env.BLOCKCHAIN_RPC_URL,
    address: admin.address,
    secretKey: admin.secretKey,
});
const getFactoryForAdmin = () => getFactory(admin.address, admin.secretKey);
function createContract(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { passphrase } = req.body;
        if (passphrase !== constants_1.admin_passphrase) {
            return res.status(UNAUTHORIZED).json({ error: 'Only admins can call this route' });
        }
        const factory = yield getFactoryForAdmin();
        console.log("creating contract");
        Logger_1.default.info(`Creating contract...`);
        const contract = yield factory.originateContract(admin.address);
        const contractAddress = contract.address;
        Logger_1.default.info(`Created contract with address ${contractAddress}`);
        Logger_1.default.info(`Creating lambda...`);
        const lambdaContractAddress = yield factory.createLambdaContract();
        Logger_1.default.info(`Created lambda with address ${lambdaContractAddress}`);
        return res.status(CREATED).json({ contract: contractAddress, lambda: lambdaContractAddress });
    });
}
exports.createContract = createContract;
const contractAddress = constants_1.contract.CONTRACT_ADDRESS;
const getFactoryWithContract = (address, secretKey) => __awaiter(void 0, void 0, void 0, function* () { return (yield getFactory(address, secretKey)).withContract(contractAddress, process.env.LAMBDA_CONTRACT_ADDRESS); });
const getFactoryWithContractForAdmin = () => getFactoryWithContract(admin.address, admin.secretKey);
function createToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { passphrase, metadata, ownerAddress } = req.body;
        if (passphrase !== constants_1.admin_passphrase) {
            return res.status(UNAUTHORIZED).json({ error: 'Only admins can call this route' });
        }
        if (!metadata || !ownerAddress) {
            return res.status(http_status_codes_1.BAD_REQUEST).json({
                error: constants_2.paramMissingError,
            });
        }
        const contract = yield getFactoryWithContractForAdmin();
        Logger_1.default.info(`Creating token for ${ownerAddress}...`);
        const tokenId = yield contract.mint(metadata, ownerAddress);
        Logger_1.default.info(`Created token ${tokenId} for ${ownerAddress}`);
        return res.status(CREATED).json({ tokenId });
    });
}
exports.createToken = createToken;
function transfertToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { address, secretKey, tokenId, to } = req.body;
        const contract = yield getFactoryWithContract(address, secretKey);
        Logger_1.default.info(`Transfering token ${tokenId} from ${address} to ${to}...`);
        yield contract.transfer([{ owner: address, tokens: [{ tokenId, to }] }]);
        Logger_1.default.info(`Transferred token ${tokenId} from ${address} to ${to}...`);
        return res.status(OK).json({ ok: true });
    });
}
exports.transfertToken = transfertToken;
function getTokenInfo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tokenId } = req.params;
        const contract = yield getFactoryWithContractForAdmin();
        const tokenInfo = yield contract.getTokenInfo(tokenId);
        const owner = yield contract.getOwner(tokenId);
        return res.status(OK).json({ tokenInfo, owner });
    });
}
exports.getTokenInfo = getTokenInfo;
function getTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { address } = req.params;
        const contract = yield getFactoryWithContractForAdmin();
        const tokenIds = yield contract.getOwnedTokens(address);
        const tokenInfos = yield Promise.all(tokenIds.sort((a, b) => a - b).map((tokenId) => __awaiter(this, void 0, void 0, function* () {
            return ({
                tokenId: tokenId,
                tokenInfo: yield contract.getTokenInfo(tokenId),
            });
        })));
        return res.status(OK).json({ tokens: tokenInfos });
    });
}
exports.getTokens = getTokens;
