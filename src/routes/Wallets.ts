import { TezosToolkit } from '@taquito/taquito';
import { mnemonicToSeed } from 'bip39';
import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import sodium from "libsodium-wrappers-sumo";

import { paramMissingError } from '@shared/constants';
import { prefix } from '@utilities/constants';
import { b58cencode } from '@utilities/crypto';


export async function createWallet(req: Request, res: Response) {
  const { username } = req.body
  if (!username) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: paramMissingError,
    })
  }

  const wallet = await walletFromUsername(username)

  return res.status(StatusCodes.OK).json({
    pk: wallet.publicKey,
    pkh: wallet.address,
  })
}

export async function getWalletBalance(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: paramMissingError,
    })
  }

  try {
    const tezos = new TezosToolkit(<string>process.env.BLOCKCHAIN_RPC_URL)
    const balance = await tezos.tz.getBalance(id)
    res.status(StatusCodes.OK).end(`${balance.toNumber() / 1000000}`)
  } catch (error) {
    console.error(JSON.stringify(error))
    res.status(500).end()
  }
}

export type Wallet = {
  username: string
  secretKey: string
  publicKey: string
  address: string
}
export const walletFromUsername = async (username: string): Promise<Wallet> => {
  await sodium.ready
  const s = await mnemonicToSeed(username, 'pasà9876ug/ordoaipjvizeuohjzàiojez').then(seed => seed.slice(0, 32))
  const kp = sodium.crypto_sign_seed_keypair(new Uint8Array(s))
  return {
    username,
    secretKey: b58cencode(kp.privateKey, prefix.edsk),
    publicKey: b58cencode(kp.publicKey, prefix.edpk),
    address: b58cencode(sodium.crypto_generichash(20, kp.publicKey), prefix.tz1),
  }
}
