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

//get a nft

export async function requestNft(req: Request, res: Response) {
    
    console.log(req.body)
    
    const { secret } = req.body;
    if (!secret) {
        return res.status(BAD_REQUEST).json({
            error: paramMissingError,
        });
    }



   /* const tezos = new TezosToolkit(<string>process.env.BLOCKCHAIN_RPC_URL);

   try {
       const balance = await tezos.tz
       .getBalance(id)
       res.status(OK).end(`${balance.toNumber() / 1000000}`);
   } catch (error) {
    console.error(JSON.stringify(error))
    res.status(500).end()
   } */
  

}


