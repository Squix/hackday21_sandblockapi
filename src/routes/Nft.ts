import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import { paramMissingError } from '@shared/constants';

const { BAD_REQUEST, CREATED, OK } = StatusCodes;

import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer'
import { db } from '@server';


//get a nft

export async function requestNft(req: Request, res: Response) {
    
    console.log(req.body)
    
    const { secret, user_public_key } = req.body;
    if (!secret) {
        return res.status(BAD_REQUEST).json({
            error: paramMissingError,
        });
    }

    const secret_table = db.getData('/secret_to_nft');

    console.log(secret_table)

    if(!secret_table[secret] || secret_table[secret].winner) {
      return res.status(BAD_REQUEST).json({
        error: "secret is invalid or already used",
      });
    }

    //si c'est bon, on fait le transfer

    //on 

    res.status(200).json({
      "nft_address":secret_table[secret].nft_address
    })

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


