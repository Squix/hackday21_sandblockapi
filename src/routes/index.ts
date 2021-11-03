import { Router } from 'express';

import { createContract, createToken, getFromMarketplace, getTokenInfo, getTokens, transfertToken } from './Contract';
import { requestNft } from './Nft';
import { createWallet, getWalletBalance } from './Wallets';

// Wallet route
const walletRouter = Router();
walletRouter.post('/', createWallet);
walletRouter.get('/:id', getWalletBalance)


// Contract route
const contractRouter = Router();
contractRouter.post('/admin/create-contract', createContract)
contractRouter.post('/admin/create-token', createToken)
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
