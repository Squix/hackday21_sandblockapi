import bs58check from 'bs58check';

export const b58cencode = (
    payload: Uint8Array,
    prefixArg: Uint8Array,
  ): string => {
      //console.log('prefixArg', prefixArg)
    const n = new Uint8Array(prefixArg.length + payload.length);
    n.set(prefixArg);
    n.set(payload, prefixArg.length);
    // @ts-ignore
    return bs58check.encode(Buffer.from(n, 'hex'));
  };

  export default {
    
    b58cencode }