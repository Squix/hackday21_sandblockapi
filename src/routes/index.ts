import { Router } from 'express';
import { getAllUsers, addOneUser, updateOneUser, deleteOneUser } from './Users';
import { createWallet, getWalletBalance } from './Wallets';


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
// Export the base-router
const baseRouter = Router();
baseRouter.use('/users', userRouter);
baseRouter.use('/wallet', walletRouter);
export default baseRouter;
