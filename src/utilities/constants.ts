export const prefix: { [key: string]: Uint8Array } = {
    tz1: new Uint8Array([6, 161, 159]),
    
  
    edsk: new Uint8Array([43, 246, 78, 7]),

    edpk: new Uint8Array([13, 15, 37, 217])

}

export const admin_passphrase = "thisismyadminpassphrase"

export const contract = {
    ADMIN_ADDRESS:"tz1MfcGT6HTt24qTeoY6nA4VHyiPfZn7QTpR",
    ADMIN_SECRET_KEY:"edsk3dhLcBj261w82AJUeyBJeQcws5WzCEsfi46dimKU9do1AYAoeV",
    CONTRACT_ADDRESS:""
}

export default {
    prefix
}

