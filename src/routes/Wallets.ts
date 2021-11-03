import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import { paramMissingError } from '@shared/constants';

const { BAD_REQUEST, CREATED, OK } = StatusCodes;

import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer'

import {mnemonicToSeed} from 'bip39';

import sodium from "libsodium-wrappers-sumo";
import pbkdf2 from 'pbkdf2';
import { b58cencode } from '../utilities/crypto';
import { prefix } from '../utilities/constants';

/**
 * Create a wallet
 *
 * @param req
 * @param res
 * @returns
 */
export async function createWallet(req: Request, res: Response) {

    const { username } = req.body;
    if (!username) {
        return res.status(BAD_REQUEST).json({
            error: paramMissingError,
        });
    }

    console.log('username', username)


   const tezos = new TezosToolkit(<string>process.env.BLOCKCHAIN_RPC_URL);

   const generatedKey = await generateKeys(username, 'pasà9876ug/ordoaipjvizeuohjzàiojez')

   tezos.setSignerProvider(await InMemorySigner.fromSecretKey(generatedKey.sk))


    /* //on le signale à la blockchain

    try {
        const operation = await tezos.tz.activate(generatedKey.pkh, "161d907951bf5594bedb1d70bb03c938d63c22be")
        await operation.confirmation()
        return res.status(OK).json(generatedKey);
      } catch (e) {
        console.log(e)
        return res.status(500).end()
      } */
      return res.status(OK).json(generatedKey);


}

export async function getWalletBalance(req: Request, res: Response) {

    console.log(req.params)

    const { id } = req.params;
    if (!id) {
        return res.status(BAD_REQUEST).json({
            error: paramMissingError,
        });
    }

   const tezos = new TezosToolkit(<string>process.env.BLOCKCHAIN_RPC_URL);

   try {
       const balance = await tezos.tz
       .getBalance(id)
       res.status(OK).end(`${balance.toNumber() / 1000000}`);
   } catch (error) {
    console.error(JSON.stringify(error))
    res.status(500).end()
   }


}

//fonction qui génère un nouveau wallet
 const generateKeys = async (
    mnemonic: string,
    passphrase?: string,
  ): Promise<any> => {
    await sodium.ready;
    const s = await mnemonicToSeed(mnemonic, passphrase).then((seed) =>
      seed.slice(0, 32),
    );
    const kp = sodium.crypto_sign_seed_keypair(new Uint8Array(s));
    return {
      mnemonic,
      passphrase,
      sk: b58cencode(kp.privateKey, prefix.edsk),
      pk: b58cencode(kp.publicKey, prefix.edpk),
      pkh: b58cencode(sodium.crypto_generichash(20, kp.publicKey), prefix.tz1),
    };
  };


