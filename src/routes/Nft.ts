import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import { Address, NFTFactory } from '../nft/contract';

import { paramMissingError } from '@shared/constants';

const { BAD_REQUEST, CREATED, OK } = StatusCodes;

import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer'
import { db } from '@server';
import logger from '@shared/Logger';

import { contract } from "../utilities/constants"


//get a nft

const getFactory = (address: Address, secretKey: string) => NFTFactory.create({
  providerUrl: <string>process.env.BLOCKCHAIN_RPC_URL,
  address:contract.ADMIN_ADDRESS,
  secretKey:contract.ADMIN_SECRET_KEY,
})

const getFactoryWithContract = async (address: Address, secretKey: string) =>
  (await getFactory(address, secretKey)).withContract(contract.CONTRACT_ADDRESS, contract.LAMBDA_CONTRACT_ADDRESS)

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
    const contractFact = await getFactoryWithContract(contract.CONTRACT_ADDRESS, contract.ADMIN_SECRET_KEY)

  //await contractFact.transfer([{owner: contract.ADMIN_ADDRESS, tokens: [<number>secret_table[secret].nft_address, user_public_key}]}])


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


