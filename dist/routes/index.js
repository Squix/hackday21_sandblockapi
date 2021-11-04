"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contract_1 = require("./contract");
const nft_1 = require("./nft");
const wallets_1 = require("./wallets");
// Wallet route
const walletRouter = (0, express_1.Router)();
walletRouter.post('/', wallets_1.createWallet);
walletRouter.get('/:id', wallets_1.getWalletBalance);
walletRouter.post('/admin/prepare', wallets_1.prepareWallet);
// Contract route
const contractRouter = (0, express_1.Router)();
contractRouter.post('/admin/create-contract', contract_1.createContract);
contractRouter.post('/admin/create-token', contract_1.createToken);
contractRouter.post('/admin/create-marketplace-token', contract_1.createMarketplaceToken);
contractRouter.post('/transfer', contract_1.transfertToken);
contractRouter.post('/marketplace/get', contract_1.getFromMarketplace);
contractRouter.get('/info/:tokenId', contract_1.getTokenInfo);
contractRouter.get('/tokens/:address', contract_1.getTokens);
const nftRouter = (0, express_1.Router)();
nftRouter.post('/request', nft_1.requestNft);
// Export the base-router
const baseRouter = (0, express_1.Router)();
baseRouter.use('/wallet', walletRouter);
baseRouter.use('/contract', contractRouter);
baseRouter.use('/nft', nftRouter);
exports.default = baseRouter;
