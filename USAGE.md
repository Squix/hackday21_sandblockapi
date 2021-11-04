# Usage

## Prepare the server

### 1. Start a local node

```sh
docker run --rm --name my-sandbox --detach -p 20000:20000 tqtezos/flextesa:20210930 granabox start
```

### 2. Start the server

```sh
npm run start:dev
```

### 3. Create contract

```sh
curl 'http://localhost:3000/contract/admin/create-contract' -d 'passphrase=thisismyadminpassphrase'
```

Then update the `src/pre-start/env/development.env` file.

---

## Prepare an account

### 1. Get the address of an account

```sh
curl 'http://localhost:3000/wallet' -d 'username=dohzya'
```

### 2. Add coins to an address

```sh
# give 1000ꜩ to dohzya
curl 'http://localhost:3000/wallet/admin/prepare' -d 'address=tz1Zg34u27wdhcpt28jFyfXiahvWyqXwMpSd&amount=1000'
```

## Prepare tokens

### Create token

```sh
curl 'http://localhost:3000/contract/admin/create-marketplace-token' -d 'passphrase=thisismyadminpassphrase&metadata={"name":"Jules"}'
```

## Standard use

### 1. Get a token from marketplace

```sh
curl 'http://localhost:3000/contract/marketplace/get' -d 'username=dohzya&tokenId=1'
```

### 2. Transfer a token to another address

```sh
# transfer to username 'manu'
curl 'http://localhost:3000/contract/transfer' -d 'username=dohzya&tokenId=1&to=tz1SeyMdJEjvitoeSCKVoDD1E7TRoAY71Jjo'
```