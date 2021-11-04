export const prefix: { [key: string]: Uint8Array } = {
    tz1: new Uint8Array([6, 161, 159]),
    edsk: new Uint8Array([43, 246, 78, 7]),
    edpk: new Uint8Array([13, 15, 37, 217]),
}

export const admin_passphrase = "thisismyadminpassphrase"

export const contract = {
    ADMIN_ADDRESS: process.env.ADMIN_ADDRESS as string,
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY as string,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS as string,
    LAMBDA_CONTRACT_ADDRESS: process.env.LAMBDA_ADDRESS as string,
}

export default {
    prefix
}

