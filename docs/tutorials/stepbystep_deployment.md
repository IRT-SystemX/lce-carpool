# Step by step deployment

You have to start by deploying and launching the Proxy. Once running, the proxy generates his public and secret keys. The public key is then used in Blockchain configuration.

## Deploy the Proxy Re-Encryption service 

### Step1 : Prepare .env file
The first step is to prepare a file named ``.env`` in the folder ``pre-services``. You find under ``pre-services`` folder an example of this file named ``.env.default``.

At this stage, you need just to choose your _SK_PROXY_PASSPHRASE_.

```
SK_PROXY_PASSPHRASE="your_secret_here"
```

### Step2 : Build and run proxy services
Execute this command to build and launch your proxy:

````bash
docker-compose -f pre-services/docker-compose.yml up -d --build
````

### Step3 : Check if its working

```
docker ps
```

You should be able to see running the _proxy_ and _proxy_mongo_ containers.

### Step4 : Generate proxy keys:

Use an HTTP client to call API requests (e.g. Postman)

To generate proxy keys, send a POST request to your proxy with your passphrase choosen above.

Method: POST

URL: http://proxy_IP_address:3000/api/proxy/keys

```
Body:
{
	"passphrase": "your_secret_here"
}
```

Example using curl:

````bash
curl -XPOST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "passphrase": "top secret" }' http://localhost:3000/api/proxy/keys
````

The response of this request will display the public and secret keys. This will also store keys in folder keys within the container in both clear and Base64 formats. The Base64 format will be used in Blockchain configuration 

## Deploy and Launch the Blockchain

### Step1 : Deploy an hyperledger fabric network

We deploy an hyperledger fabric network using the Blockchain Network Composer (BNC).

````bash
sudo curl -L https://raw.githubusercontent.com/bxforce/bnc-hlf/master/bin/bnc -o /usr/local/bin/bnc && sudo chmod +x /usr/local/bin/bnc
````

We provide here an example of configuration files with two organizations (two carpooling operators) in a single machine. If you want to deploy other configurations, you should update config files under ``hlf-config/hlf`` folder.

Below, command lines to deploy the network:

````bash
bnc generate --config-folder $PWD/hlf-config/hlf -f config-org2.yaml 
bnc generate --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -g config-genesis-org1-org2.yaml

bnc start --config-folder $PWD/hlf-config/hlf -f config-org2.yaml
bnc start --config-folder $PWD/hlf-config/hlf -f config-org1.yaml

sleep 10

bnc channel deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml 
bnc channel deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml --no-create
````

 Check that your network is working using _docker ps_ command line. You should be able to see running the orderers/peers configured in the config.yaml file.

### Step2 : Configure chaincodes

You start by adding the proxy public key in chaincodes configuration. To do that, update the ``.env.default`` file in each chaincode folder (kms, offers, transactions and proofs).

Put the generated public key encoded in Base64 in ``.env.default`` file.

```
PK_PROXY_B64=LS0tLS1CRUdJTiBFTkNSW.....
```

Then, update the _PROXY_URL_ variable with the right proxy IP address.

In offers, transactions and proofs chaincodes, PROXY_URL variable will be :
```
PROXY_URL=http://proxy_IP_address:3000/api/proxy/reencrypt
```

In kms chaincode, PROXY_URL variable will be :
```
PROXY_URL=http://proxy_IP_address:3000/api/proxy/rekey
```

### Step3 : Deploy chaincodes
Build your chaincodes one by one:
````bash
mkdir -p /tmp/hyperledger-fabric-chaincode/
cp -r $PWD/hlf-chaincodes/* /tmp/hyperledger-fabric-chaincode/
docker run --rm -v /tmp/hyperledger-fabric-chaincode/offers:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"
docker run --rm -v /tmp/hyperledger-fabric-chaincode/transactions:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"
docker run --rm -v /tmp/hyperledger-fabric-chaincode/proofs:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"
docker run --rm -v /tmp/hyperledger-fabric-chaincode/kms:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"
````

Then, deploy your chaincodes. As you can see in command lines, each chaincode is deployed in both organizations. After deploying a chaincode in the first organization, you will just see approvals in you logs. Deploy the chaincode in the second organization to see the success message in your logs.

Note that for each deploy of the chaincode on the first org, you will see a log looking like an error:

```
{
        "approvals": {
                "org1MSP": false,
                "org2MSP": true
        }
}
```

It is the normal behavior because the chaincode must be deployed and approved by the second org to be fully working:
```
{
        "approvals": {
                "org1MSP": true,
                "org2MSP": true
        }
}
```

The following commands will deploy chaincodes :

````bash
bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_offers.yaml --policy
bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_offers.yaml --policy

bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_transactions.yaml --policy
bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_transactions.yaml --policy

bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_proofs.yaml --policy
bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_proofs.yaml --policy

bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_kms.yaml --policy --private
bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_kms.yaml --policy --private
````

Check that your network is working using _docker ps_ command line. You should be able to see running the dev-peer containers of your chaincodes.


## API services

The last step is to deploy API services. Note that you need an API services layer for each organization. Here we have two organizations in the same machine, so we will just duplicate .env and docker-compose files. If API services will be deployed in two different machines, you need an api folder in each machine.

### Step1 : Configure Api services

For each API services, update ``.env`` and ``docker-compose-dev.yaml`` files to set your configuration.
The idea is to connect the API services with the blockchain. So, each API services should be configured with the right organization information set before in ``config-org1.yaml`` and ``config-org2.yaml`` files.

In ``.env_org2`` file :
```
#############
## fabric  ##
#############
ENABLE_HLF=true
PEER_HOST=peer0.org2.bnc.com
ORDERER_HOST=orderer1.bnc.com
CA_HOST=ca2.org2
CA_NAME=ca2.org2
MSPID=org2MSP
USER_ID=admin
USER_AFFILIATION=org2
CCP_PATH=/tmp/hyperledger-fabric-network/settings/connection-profile-join-channel-org2.yaml
PEER_TLS_CA_CERTS_PATH=/tmp/hyperledger-fabric-network/organizations/peerOrganizations/org2.bnc.com/peers/peer0.org2.bnc.com/msp/tlscacerts/tlsca.org2.bnc.com-cert.pem
ORDERER_TLS_CA_CERTS_PATH=/tmp/hyperledger-fabric-network/organizations/ordererOrganizations/org2.bnc.com/tlsca/tlsca.bnc.com-cert.pem

#############
## mongodb ##
#############
...
MONGO_NAME=carpooling2_development
MONGO_HOST=carpooling2_mongodb
...
```

In ``docker-compose-org2.yaml`` file :
```
carpooling-rest-api:
  container_name: carpooling2_lce.${CONTAINER_VERSION}
  volumes: /home/ubuntu/stores2/creds:/var/app/src/config/creds
  ports: "4001:4000"

carpooling_mongodb:
  container_name: carpooling2_mongodb
  ports: "27018:27017"
```

### Step2 : Build and run API services
Execute these commands to build and launch both api services :

````bash
docker run --rm -v "$PWD":/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install --production"
export CONTAINER_VERSION=2.1.4
docker-compose -f docker-compose-org1.yaml up -d --build
docker-compose -f docker-compose-org2.yaml up -d --build
````

### Step3 : Check if its working

Check that your api services layer is working using _docker ps_ command line. You should be able to see running the two carpooling_lce containers and their databases mongo.

## Clear the platform

````bash
bnc rm --config-folder $PWD/hlf-config/hlf -f config-org1.yaml
bnc rm --config-folder $PWD/hlf-config/hlf -f config-org2.yaml
docker rm -f carpooling_lce_1 carpooling_mongodb_1
docker rm -f carpooling_lce_2 carpooling_mongodb_2
docker rm -f proxy proxy_mongo
````
