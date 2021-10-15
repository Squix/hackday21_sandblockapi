"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Wallets_1 = require("./Wallets");
const Contract_1 = require("./Contract");
const Nft_1 = require("./Nft");
// Wallet route
const walletRouter = (0, express_1.Router)();
walletRouter.post('/', Wallets_1.createWallet);
walletRouter.get('/:id', Wallets_1.getWalletBalance);
// Contract route
const contractRouter = (0, express_1.Router)();
contractRouter.post('/admin/create-contract', Contract_1.createContract);
contractRouter.post('/admin/create-token', Contract_1.createToken);
contractRouter.post('/transfer', Contract_1.transfertToken);
contractRouter.get('/info/:tokenId', Contract_1.getTokenInfo);
contractRouter.get('/tokens/:address', Contract_1.getTokens);
const nftRouter = (0, express_1.Router)();
nftRouter.post('/request', Nft_1.requestNft);
// Export the base-router
const baseRouter = (0, express_1.Router)();
baseRouter.use('/wallet', walletRouter);
baseRouter.use('/contract', contractRouter);
baseRouter.use('/nft', nftRouter);
exports.default = baseRouter;
