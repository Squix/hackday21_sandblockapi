import StatusCodes from 'http-status-codes';
import { Response } from 'express';

import logger from '@shared/Logger';
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
  logger.info(`Creating contract...`)
  const contract = await factory.originateContract(admin.address)
  const contractAddress = contract.address
  logger.info(`Created contract with address ${contractAddress}`)
  logger.info(`Creating lambda...`)
  const lambdaContractAddress = await factory.createLambdaContract()
  logger.info(`Created lambda with address ${lambdaContractAddress}`)

  return res.status(CREATED).json({contract: contractAddress, lambda: lambdaContractAddress });
}

const contractAddress = <string>process.env.CONTRACT_ADDRESS
const getFactoryWithContract = async (address: Address, secretKey: string) =>
  (await getFactory(address, secretKey)).withContract(contractAddress, <string>process.env.LAMBDA_CONTRACT_ADDRESS)

const getFactoryWithContractForAdmin = () => getFactoryWithContract(admin.address, admin.secretKey)

export async function createToken(req: any, res: Response) {
  const { passphrase, metadata, ownerAddress } = req.body
  if (passphrase !== 'thisismyadminpassphrase') {
    return res.status(UNAUTHORIZED).json({error: 'Only admins can call this route'})
  }
  const contract = await getFactoryWithContractForAdmin()
  logger.info(`Creating token for ${ownerAddress}...`)
  const tokenId = await contract.mint(metadata, ownerAddress)
  logger.info(`Created token ${tokenId} for ${ownerAddress}`)

  return res.status(CREATED).json({tokenId});
}

export async function transfertToken(req: any, res: Response) {
  const { address, secretKey, tokenId, to } = req.body
  const contract = await getFactoryWithContract(address, secretKey)
  logger.info(`Transfering token ${tokenId} from ${address} to ${to}...`)
  await contract.transfer([{owner: address, tokens: [{tokenId, to}]}])
  logger.info(`Transferred token ${tokenId} from ${address} to ${to}...`)

  return res.status(OK).json({ok: true});
}

export async function getTokenInfo(req: any, res: Response) {
  const { tokenId } = req.params
  const contract = await getFactoryWithContractForAdmin()
  const tokenInfo = await contract.getTokenInfo(tokenId)
  const owner = await contract.getOwner(tokenId)

  return res.status(OK).json({ tokenInfo, owner });
}

export async function getTokens(req: any, res: Response) {
  const { address } = req.params
  const contract = await getFactoryWithContractForAdmin()
  const tokenIds = await contract.getOwnedTokens(address)

  const tokenInfos = await Promise.all(tokenIds.sort((a, b) => a - b).map(async (tokenId) => ({
    tokenId: tokenId,
    tokenInfo: await contract.getTokenInfo(tokenId),
  })))

  return res.status(OK).json({tokens: tokenInfos});
}
