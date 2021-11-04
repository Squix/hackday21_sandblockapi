import StatusCodes from 'http-status-codes'
import { Response } from 'express'

import { paramMissingError } from '@shared/constants';
import logger from '@shared/logger';
import { admin_passphrase, contract } from '@utilities/constants';

import { Address, NFTFactory } from '../nft/contract'
import { walletFromUsername } from './wallets';

const admin = {
  address: contract.ADMIN_ADDRESS,
  secretKey: contract.ADMIN_SECRET_KEY
}

const getFactory = (address: Address, secretKey: string) => NFTFactory.create({
  providerUrl: process.env.BLOCKCHAIN_RPC_URL as string,
  address: admin.address,
  secretKey: admin.secretKey,
})

const getFactoryForAdmin = () => getFactory(admin.address, admin.secretKey)

export async function createContract(req: any, res: Response) {
  const { passphrase } = req.body
  if (passphrase !== admin_passphrase) {
    return res.status(StatusCodes.UNAUTHORIZED).json({error: 'Only admins can call this route'})
  }

  const factory = await getFactoryForAdmin()
  logger.info(`Creating contract...`)

  const contract = await factory.originateContract(admin.address)
  const contractAddress = contract.address
  logger.info(`Created contract with address ${contractAddress}`)
  logger.info(`Creating lambda...`)
  const lambdaContractAddress = await factory.createLambdaContract()
  logger.info(`Created lambda with address ${lambdaContractAddress}`)

  return res.status(StatusCodes.CREATED).json({contract: contractAddress, lambda: lambdaContractAddress });

}

const contractAddress = contract.CONTRACT_ADDRESS
const getFactoryWithContract = async (address: Address, secretKey: string) =>
  (await getFactory(address, secretKey)).withContract(contractAddress, <string>process.env.LAMBDA_CONTRACT_ADDRESS)

const getFactoryWithContractForAdmin = () => getFactoryWithContract(admin.address, admin.secretKey)

export async function createToken(req: any, res: Response) {
  const { passphrase, metadata, ownerAddress } = req.body
  if (passphrase !== admin_passphrase) {
    return res.status(StatusCodes.UNAUTHORIZED).json({error: 'Only admins can call this route'})
  }
  if(!metadata || !ownerAddress) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: paramMissingError,
  });
  }
  const contract = await getFactoryWithContractForAdmin()
  logger.info(`Creating token for ${ownerAddress}...`)
  const tokenId = await contract.mint(metadata, ownerAddress)
  logger.info(`Created token ${tokenId} for ${ownerAddress}`)

  return res.status(StatusCodes.CREATED).json({tokenId});
}

export async function createMarketplaceToken(req: any, res: Response) {
  return createToken({...req, body: {...req.body, ownerAddress: admin.address}}, res)
}

export async function getFromMarketplace(req: any, res: Response) {
  const { username, tokenId }: { username: string, tokenId: number } = req.body
  const { address } = await walletFromUsername(username)
  const contract = await getFactoryWithContractForAdmin()
  logger.info(`Transfering token ${tokenId} from marketplace to ${address}...`)
  await contract.transfer([{owner: admin.address, tokens: [{tokenId, to: address}]}])
  logger.info(`Transferred token ${tokenId} from marketplace to ${address}`)

  return res.status(StatusCodes.NO_CONTENT).end()
}

export async function transfertToken(req: any, res: Response) {
  const { username, tokenId, to } = req.body
  const { address, secretKey } = await walletFromUsername(username)
  const contract = await getFactoryWithContract(address, secretKey)
  logger.info(`Transfering token ${tokenId} from ${username} (${address}) to ${to}...`)
  await contract.transfer([{owner: address, tokens: [{tokenId, to}]}])
  logger.info(`Transferred token ${tokenId} from ${username} (${address}) to ${to}`)

  return res.status(StatusCodes.NO_CONTENT).end()
}

export async function getTokenInfo(req: any, res: Response) {
  const { tokenId } = req.params
  const contract = await getFactoryWithContractForAdmin()
  const tokenInfo = await contract.getTokenInfo(tokenId)
  const owner = await contract.getOwner(tokenId)

  return res.status(StatusCodes.OK).json({ tokenInfo, owner })
}

export async function getTokens(req: any, res: Response) {
  const { address } = req.params
  const contract = await getFactoryWithContractForAdmin()
  const tokenIds = await contract.getOwnedTokens(address)

  const tokenInfos = await Promise.all(tokenIds.sort((a, b) => a - b).map(async (tokenId) => ({
    tokenId: tokenId,
    tokenInfo: await contract.getTokenInfo(tokenId),
  })))

  return res.status(StatusCodes.OK).json({tokens: tokenInfos})
}
