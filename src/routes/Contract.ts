import StatusCodes from 'http-status-codes';
import { Response } from 'express';

import { Address, NFTFactory } from '../nft/contract';

const { CREATED, OK, UNAUTHORIZED } = StatusCodes;

const admin = {
  address: <string>process.env.ADMIN_ADDRESS,
  secretKey: <string>process.env.ADMIN_SECRET_KEY
}

const getFactory = (address: Address, secretKey: string) => NFTFactory.create({
  providerUrl: <string>process.env.BLOCKCHAIN_RPC_URL,
  address,
  secretKey,
})

const getFactoryForAdmin = () => getFactory(admin.address, admin.secretKey)

export async function createContract(req: any, res: Response) {
  const { passphrase } = req.body
  if (passphrase !== 'thisismyadminpassphrase') {
    return res.status(UNAUTHORIZED).json({error: 'Only admins can call this route'})
  }
  const factory = await getFactoryForAdmin()
  const contract = await factory.originateContract(admin.address)

  return res.status(CREATED).json({address: contract.address});
}

const contractAddress = ''
const getFactoryWithContract = async (address: Address, secretKey: string) => NFTFactory.createWithContract({
  providerUrl: <string>process.env.BLOCKCHAIN_RPC_URL,
  address,
  secretKey,
}, contractAddress)

const getFactoryWithContractForAdmin = () => getFactoryWithContract(admin.address, admin.secretKey)

export async function createToken(req: any, res: Response) {
  const { passphrase, metadata, ownerAddress } = req.body
  if (passphrase !== 'thisismyadminpassphrase') {
    return res.status(UNAUTHORIZED).json({error: 'Only admins can call this route'})
  }
  const { contract } = await getFactoryWithContractForAdmin()
  const tokenId = await contract.mint(metadata, ownerAddress)

  return res.status(CREATED).json({tokenId});
}

export async function transfertToken(req: any, res: Response) {
  const { address, secretKey, tokenId, to } = req.body
  const { contract } = await getFactoryWithContract(address, secretKey)
  await contract.transfer([{owner: address, tokens: [{tokenId, to}]}])

  return res.status(OK).json({ok: true});
}

export async function getTokenInfo(req: any, res: Response) {
  const { tokenId } = req.body
  const { contract } = await getFactoryWithContractForAdmin()
  const tokenInfo = await contract.getTokenInfo(tokenId)
  const owner = contract.getOwner(tokenId)

  return res.status(OK).json({ tokenInfo, owner });
}

export async function getTokens(req: any, res: Response) {
  const { address } = req.body
  const { contract } = await getFactoryWithContractForAdmin()
  const tokenIds = await contract.getOwnedTokens(address)

  const tokenInfos = Promise.all(tokenIds.sort((a, b) => a - b).map(contract.getTokenInfo))

  return res.status(OK).json({tokens: tokenInfos});
}
