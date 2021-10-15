export const prefix: { [key: string]: Uint8Array } = {
    tz1: new Uint8Array([6, 161, 159]),
    
  
    edsk: new Uint8Array([43, 246, 78, 7]),

    edpk: new Uint8Array([13, 15, 37, 217])

}

export const admin_passphrase = "thisismyadminpassphrase"

export const contract = {
    ADMIN_ADDRESS:<string>process.env.ADMIN_ADDRESS,
    ADMIN_SECRET_KEY:<string>process.env.ADMIN_SECRET_KEY,
    CONTRACT_ADDRESS:<string>process.env.CONTRACT_ADDRESS,
    LAMBDA_CONTRACT_ADDRESS:<string>process.env.LAMBDA_ADDRESS
}

export default {
    prefix
}

