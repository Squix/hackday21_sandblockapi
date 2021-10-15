import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import { TezosToolkit, MichelsonMap, ContractProvider, ContractMethod, VIEW_LAMBDA, ContractAbstraction, MichelCodecPacker, BigMapAbstraction } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'
import { BigNumber } from 'bignumber.js'
import { tzip12, Tzip12Module } from '@taquito/tzip12'
import { bytes2Char, char2Bytes } from '@taquito/utils'
import { config } from 'yargs'

export type TokenId = number
export type Address = string
export type Bytes = string

type Contract = ContractAbstraction<ContractProvider>

type Ctx = {
  toolkit: TezosToolkit
  address: Address
  lambdaContractAddress: Address | undefined
}

type CtxWithContract = Ctx & {
  contract: Contract
}

type OriginateContract = (ownerAddress: string) => Promise<Contract>
const originateContract = (ctx: Ctx): OriginateContract => async (ownerAddress: string) => {

  // const code: string = (await promisify(fs.readFile)(path.join(__dirname, "../../ligo/out/contract.tz"))).toString()
  const code: string = (await promisify(fs.readFile)(path.join(__dirname, "../ligo/out/contract.tz"))).toString()

  const metadata = new MichelsonMap<string, Bytes>()
  metadata.set("", char2Bytes("tezos-storage:contents"))
  metadata.set("contents", char2Bytes(JSON.stringify({"version":"v0.1.0","name":"test","authors":["Fabernovel"],"interfaces":["TZIP-012","TZIP-016"]})))

  const storage = {
    ledger: new MichelsonMap(),
    operators: new MichelsonMap(),
    reverse_ledger: new MichelsonMap(),
    metadata: metadata,
    token_metadata: new MichelsonMap(),
    last_token_id: new BigNumber(0),
    admin: ownerAddress,
  }
  const origParam = { code, storage }
  const originationOp = await ctx.toolkit.contract.originate(origParam)
  await originationOp.confirmation()
  const contract = await originationOp.contract()

  return contract
}

type Mint<T> = (metadata: T, ownerAddress: string) => Promise<TokenId>
const mint = <T>(ctx: CtxWithContract): Mint<T> =>
  async (metadata: T, ownerAddress: string) => {
    const mintOp: (bytes: Bytes, ownerAddress: Address) => ContractMethod<ContractProvider> = ctx.contract.methods.mint
    const res = await mintOp(char2Bytes(JSON.stringify(metadata)), ownerAddress).send()
    // Let's dig inside the response and guess where the last_token_id value is stored 🤷
    const token_id = (res.results[0] as any).metadata.operation_result.storage.args[0].args[0].args[1]['int']
    await res.confirmation()
    return token_id
  }

type Burn = (tokenId: TokenId) => Promise<void>
const burn = (ctx: CtxWithContract): Burn =>
  async (tokenId: TokenId) => {
    const res = await ctx.contract.methods.burn(tokenId).send()
    await res.confirmation()
  }

type BalanceOf = (params: {owner: Address, tokenId: TokenId}[]) => Promise<{owner: Address, tokenId: TokenId, owned: boolean}[]>
const balanceOf = (ctx: CtxWithContract): BalanceOf =>
  async (params: {owner: Address, tokenId: TokenId}[]) => {
    const result: {request: {owner: Address, token_id: BigNumber}, balance: BigNumber}[] =
      await ctx.contract.views.balance_of(params.map(q => ({owner: q.owner, token_id: q.tokenId}))).read(ctx.lambdaContractAddress)
    return result.map(res => ({
      owner: res.request.owner,
      tokenId: res.request.token_id.toNumber(),
      owned: res.balance.toNumber() === 1,
    }))
  }

type Transfer = (params: {owner: Address, tokens: {to: Address, tokenId: TokenId}[]}[]) => Promise<void>
const transfer = (ctx: CtxWithContract): Transfer =>
  async (params: {owner: Address, tokens: {to: Address, tokenId: TokenId}[]}[]) => {
    const result = await ctx.contract.methods.transfer(params.map(param => ({
      from_: param.owner,
      txs: param.tokens.map(token => ({to_: token.to, token_id: token.tokenId, amount: 1})),
    }))).send()
    await result.confirmation()
  }

export type UpdateOperator = {action: 'Add' | 'Remove', operator: Address, tokenId: TokenId}
export const AddOperator = (operator: Address, tokenId: TokenId): UpdateOperator => ({operator, tokenId, action: 'Add'})
export const RemoveOperator = (operator: Address, tokenId: TokenId): UpdateOperator => ({operator, tokenId, action: 'Remove'})
type UpdateOperators = (ops: UpdateOperator[]) => Promise<void>
const updateOperators = (ctx: CtxWithContract): UpdateOperators =>
  async (ops: UpdateOperator[]) => {
    const op = await ctx.contract.methods.update_operators(ops.map(update => ({
      [update.action === 'Add' ? 'add_operator' : 'remove_operator']: {
        "owner": ctx.address,
        "operator": update.operator,
        "token_id": update.tokenId,
      }
    }))).send()
    await op.confirmation()
  }

type AddOperator = (operator: Address, tokenId: TokenId) => Promise<void>
const addOperator = (ctx: CtxWithContract): AddOperator =>
  (operator: Address, tokenId: TokenId) => updateOperators(ctx)([AddOperator(operator, tokenId)])

type RemoveOperator = (operator: Address, tokenId: TokenId) => Promise<void>
const removeOperator = (ctx: CtxWithContract): RemoveOperator =>
  (operator: Address, tokenId: TokenId) => updateOperators(ctx)([RemoveOperator(operator, tokenId)])

export type GetTokenInfo<T> = (tokenId: TokenId) => Promise<undefined | T>
const getTokenInfo = <T>(ctx: CtxWithContract): GetTokenInfo<T> =>
  async (tokenId: TokenId) => {
    const storage: any = await ctx.contract.storage()
    const metadata: BigMapAbstraction = storage.token_metadata
    const tokenInfoMap = await metadata.get<{token_info: MichelsonMap<any, any>}>(tokenId)
    if (tokenInfoMap === undefined) {
      return undefined
    }
    return JSON.parse(bytes2Char(tokenInfoMap.token_info.get('')))
  }

export type GetOwner = (tokenId: TokenId) => Promise<Address | undefined>
const getOwner = (ctx: CtxWithContract): GetOwner =>
  async (tokenId: TokenId) => {
    const storage: any = await ctx.contract.storage()
    const ledger: BigMapAbstraction = storage.ledger
    return ledger.get<Address>(tokenId)
  }

export type GetOwnedTokens = (account: Address) => Promise<TokenId[]>
const getOwnedTokens = (ctx: CtxWithContract): GetOwnedTokens =>
  async (account: Address) => {
    const storage: any = await ctx.contract.storage()
    const reverseLedger: BigMapAbstraction = storage.reverse_ledger
    const tokenIds = await reverseLedger.get<BigNumber[]>(account)
    return tokenIds?.map(id => id.toNumber()) ?? []
  }


export type NTFContract<T> = {
  /** Creation of a new token for a given account */
  mint: Mint<T>
  /** Suppression of an existing token */
  burn: Burn
  /** Check if a given token is owned by a given account */
  balanceOf: BalanceOf
  /** Transfer a token from a owner to another */
  transfer: Transfer
  /** Give/revoke permission to other accounts to transfer given tokens */
  updateOperators: UpdateOperators
  /** Give permission to an other account to transfer a given token */
  addOperator: AddOperator
  /** Revoke permission to an other account to transfer a given token */
  removeOperator: RemoveOperator
  /** Return the token meta information */
  getTokenInfo: GetTokenInfo<T>
  /** Return the account owning a given token */
  getOwner: GetOwner
  /** Return the tokens owned by a given address */
  getOwnedTokens: GetOwnedTokens
}

export type NFTFactory<T> = {
  /** Create the NFT contract (on the blockchain), in which the tokens will be manipulated */
  originateContract: OriginateContract
  /** Create a NFT instance, for a given contract */
  withContract: (contractAddress: Address) => Promise<NTFContract<T>>
}

export type Config = {
  providerUrl: string,
  address: Address,
  secretKey: string,
}
export const NFTFactory = {

  createWithContract: async <T>(config: Config, contractAddress: Address) => {
    const factory = await NFTFactory.create(config)
    const contract = await factory.withContract(contractAddress)
    return { factory, contract }
  },

  /** Create a NFTFactory instance for a given blockchain address and a given account */
  create: async <T>(config: Config): Promise<NFTFactory<T>> => {

    const toolkit = new TezosToolkit(config.providerUrl)
    toolkit.addExtension(new Tzip12Module())
    toolkit.setPackerProvider(new MichelCodecPacker());
    toolkit.setSignerProvider(await InMemorySigner.fromSecretKey(config.secretKey))

    let lambdaContractAddress: Address | undefined
    const op = await toolkit.contract.originate({
      code: VIEW_LAMBDA.code,
      storage: VIEW_LAMBDA.storage,
    });
    const lambdaContract = await op.contract();
    lambdaContractAddress = lambdaContract.address;
    const ctx = {
      toolkit: toolkit,
      address: config.address,
      lambdaContractAddress: lambdaContractAddress,
    }

    return {
      originateContract: originateContract(ctx),
      withContract: async (contractAddress: Address): Promise<NTFContract<T>> => {
        const contract: Contract = await toolkit.contract.at(contractAddress, tzip12)
        const ctxWithContract = {
          ...ctx,
          contract: contract,
        }
        return {
          mint: mint(ctxWithContract),
          burn: burn(ctxWithContract),
          balanceOf: balanceOf(ctxWithContract),
          transfer: transfer(ctxWithContract),
          updateOperators: updateOperators(ctxWithContract),
          addOperator: addOperator(ctxWithContract),
          removeOperator: removeOperator(ctxWithContract),
          getTokenInfo: getTokenInfo(ctxWithContract),
          getOwner: getOwner(ctxWithContract),
          getOwnedTokens: getOwnedTokens(ctxWithContract),
        }
      }
    }

  },
}
export default NFTFactory;