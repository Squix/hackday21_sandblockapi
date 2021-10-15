import { Router } from 'express';
import { createWallet, getWalletBalance } from './Wallets';
import { createContract, createToken, getTokenInfo, getTokens, transfertToken } from './Contract';
import { requestNft } from './Nft';

// Wallet route
const walletRouter = Router();
walletRouter.post('/', createWallet);
walletRouter.get('/:id', getWalletBalance)


// Contract route
const contractRouter = Router();
contractRouter.post('/admin/create-contract', createContract)
contractRouter.post('/admin/create-token', createToken)
contractRouter.post('/transfer', transfertToken)
contractRouter.get('/info', getTokenInfo)
contractRouter.get('/tokens', getTokens)

const nftRouter = Router();
nftRouter.post('/request', requestNft)


// Export the base-router
const baseRouter = Router();
baseRouter.use('/wallet', walletRouter);
baseRouter.use('/contract', contractRouter);
baseRouter.use('/nft', nftRouter);
export default baseRouter;
