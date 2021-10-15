import { Router } from 'express';
import { getAllUsers, addOneUser, updateOneUser, deleteOneUser } from './Users';
import { createWallet, getWalletBalance } from './Wallets';
import { createContract, createToken, getTokenInfo, getTokens, transfertToken } from './Contract';


// User-route
const userRouter = Router();
userRouter.get('/all', getAllUsers);
userRouter.post('/add', addOneUser);
userRouter.put('/update', updateOneUser);
userRouter.delete('/delete/:id', deleteOneUser);

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

// Export the base-router
const baseRouter = Router();
baseRouter.use('/users', userRouter);
baseRouter.use('/wallet', walletRouter);
baseRouter.use('/contract', contractRouter);
export default baseRouter;
