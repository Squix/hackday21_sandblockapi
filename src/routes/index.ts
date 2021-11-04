import { Router } from 'express';

import { createContract, createMarketplaceToken, createToken, getFromMarketplace, getTokenInfo, getTokens, transfertToken } from './contract';
import { requestNft } from './nft';
import { createWallet, getWalletBalance, prepareWallet } from './wallets';

// Wallet route
const walletRouter = Router();
walletRouter.post('/', createWallet);
walletRouter.get('/:id', getWalletBalance)
walletRouter.post('/admin/prepare', prepareWallet)


// Contract route
const contractRouter = Router();
contractRouter.post('/admin/create-contract', createContract)
contractRouter.post('/admin/create-token', createToken)
contractRouter.post('/admin/create-marketplace-token', createMarketplaceToken)
contractRouter.post('/transfer', transfertToken)
contractRouter.post('/marketplace/get', getFromMarketplace)
contractRouter.get('/info/:tokenId', getTokenInfo)
contractRouter.get('/tokens/:address', getTokens)

const nftRouter = Router();
nftRouter.post('/request', requestNft)


// Export the base-router
const baseRouter = Router();
baseRouter.use('/wallet', walletRouter);
baseRouter.use('/contract', contractRouter);
baseRouter.use('/nft', nftRouter);
export default baseRouter;
