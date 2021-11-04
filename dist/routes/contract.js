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
exports.getTokens = exports.getTokenInfo = exports.transfertToken = exports.getFromMarketplace = exports.createMarketplaceToken = exports.createToken = exports.createContract = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const constants_1 = require("@shared/constants");
const logger_1 = __importDefault(require("@shared/logger"));
const constants_2 = require("@utilities/constants");
const contract_1 = require("../nft/contract");
const wallets_1 = require("./wallets");
const admin = {
    address: constants_2.contract.ADMIN_ADDRESS,
    secretKey: constants_2.contract.ADMIN_SECRET_KEY
};
const getFactory = (address, secretKey) => contract_1.NFTFactory.create({
    providerUrl: process.env.BLOCKCHAIN_RPC_URL,
    address,
    secretKey,
});
const getFactoryForAdmin = () => getFactory(admin.address, admin.secretKey);
function createContract(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { passphrase } = req.body;
        if (passphrase !== constants_2.admin_passphrase) {
            return res.status(http_status_codes_1.default.UNAUTHORIZED).json({ error: 'Only admins can call this route' });
        }
        const factory = yield getFactoryForAdmin();
        logger_1.default.info(`Creating contract...`);
        const contract = yield factory.originateContract(admin.address);
        const contractAddress = contract.address;
        logger_1.default.info(`Created contract with address ${contractAddress}`);
        logger_1.default.info(`Creating lambda...`);
        const lambdaContractAddress = yield factory.createLambdaContract();
        logger_1.default.info(`Created lambda with address ${lambdaContractAddress}`);
        return res.status(http_status_codes_1.default.CREATED).json({ contract: contractAddress, lambda: lambdaContractAddress });
    });
}
exports.createContract = createContract;
const contractAddress = constants_2.contract.CONTRACT_ADDRESS;
const getFactoryWithContract = (address, secretKey) => __awaiter(void 0, void 0, void 0, function* () { return (yield getFactory(address, secretKey)).withContract(contractAddress, process.env.LAMBDA_CONTRACT_ADDRESS); });
const getFactoryWithContractForAdmin = () => getFactoryWithContract(admin.address, admin.secretKey);
function createToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { passphrase, metadata, ownerAddress } = req.body;
        if (passphrase !== constants_2.admin_passphrase) {
            return res.status(http_status_codes_1.default.UNAUTHORIZED).json({ error: 'Only admins can call this route' });
        }
        if (!metadata || !ownerAddress) {
            return res.status(http_status_codes_1.default.BAD_REQUEST).json({
                error: constants_1.paramMissingError,
            });
        }
        const contract = yield getFactoryWithContractForAdmin();
        logger_1.default.info(`Creating token for ${ownerAddress}...`);
        const tokenId = yield contract.mint(metadata, ownerAddress);
        logger_1.default.info(`Created token ${tokenId} for ${ownerAddress}`);
        return res.status(http_status_codes_1.default.CREATED).json({ tokenId });
    });
}
exports.createToken = createToken;
function createMarketplaceToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return createToken(Object.assign(Object.assign({}, req), { body: Object.assign(Object.assign({}, req.body), { ownerAddress: admin.address }) }), res);
    });
}
exports.createMarketplaceToken = createMarketplaceToken;
function getFromMarketplace(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, tokenId } = req.body;
        const { address } = yield (0, wallets_1.walletFromUsername)(username);
        const contract = yield getFactoryWithContractForAdmin();
        logger_1.default.info(`Transfering token ${tokenId} from marketplace to ${address}...`);
        yield contract.transfer([{ owner: admin.address, tokens: [{ tokenId, to: address }] }]);
        logger_1.default.info(`Transferred token ${tokenId} from marketplace to ${address}`);
        return res.status(http_status_codes_1.default.NO_CONTENT).end();
    });
}
exports.getFromMarketplace = getFromMarketplace;
function transfertToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, tokenId, to } = req.body;
        const { address, secretKey } = yield (0, wallets_1.walletFromUsername)(username);
        const contract = yield getFactoryWithContract(address, secretKey);
        logger_1.default.info(`Transfering token ${tokenId} from ${username} (${address}) to ${to}...`);
        yield contract.transfer([{ owner: address, tokens: [{ tokenId, to }] }]);
        logger_1.default.info(`Transferred token ${tokenId} from ${username} (${address}) to ${to}`);
        return res.status(http_status_codes_1.default.NO_CONTENT).end();
    });
}
exports.transfertToken = transfertToken;
function getTokenInfo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tokenId } = req.params;
        const contract = yield getFactoryWithContractForAdmin();
        const tokenInfo = yield contract.getTokenInfo(tokenId);
        const owner = yield contract.getOwner(tokenId);
        return res.status(http_status_codes_1.default.OK).json({ tokenInfo, owner });
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
        return res.status(http_status_codes_1.default.OK).json({ tokens: tokenInfos });
    });
}
exports.getTokens = getTokens;
