import { Router } from 'express';
import { createWallet, getWalletBalance } from './Wallets';
import { requestNft } from './Nft';

// Wallet route
const walletRouter = Router();
walletRouter.post('/', createWallet);
walletRouter.get('/:id', getWalletBalance)

const nftRouter = Router();
nftRouter.post('/request', requestNft)

// Export the base-router
const baseRouter = Router();
baseRouter.use('/wallet', walletRouter);
baseRouter.use('/nft', nftRouter);
export default baseRouter;
