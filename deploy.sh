#!/bin/sh
#set -ex

clean_all () {

    docker rm -f carpooling_lce_1 carpooling_mongodb_1
    docker rm -f carpooling_lce_2 carpooling_mongodb_2
    docker rm -f proxy proxy_mongo
    bnc rm --config-folder $PWD/hlf-config/hlf -f config-org1.yaml
    bnc rm --config-folder $PWD/hlf-config/hlf -f config-org2.yaml

}

build_chaincode () {
    
    rm -rf /tmp/hyperledger-fabric-chaincode/
    mkdir -p /tmp/hyperledger-fabric-chaincode/
    cp -r $PWD/hlf-chaincodes/* /tmp/hyperledger-fabric-chaincode/

    docker run --rm -v /tmp/hyperledger-fabric-chaincode/offers:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"
    docker run --rm -v /tmp/hyperledger-fabric-chaincode/transactions:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"
    docker run --rm -v /tmp/hyperledger-fabric-chaincode/proofs:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"
    docker run --rm -v /tmp/hyperledger-fabric-chaincode/kms:/usr/src/app -w /usr/src/app node:8.15.1 sh -c "npm install && npm run clean && npm run build"

}

setup_chaincode () {
    
    sed -i 's/PK_PROXY_B64=.*/PK_PROXY_B64='`cat "$PWD/pre-services/keys/pk" | base64 | tr -d '\n'`'/' "/tmp/hyperledger-fabric-chaincode/kms/.env.default"
    sed -i 's/PK_PROXY_B64=.*/PK_PROXY_B64='`cat "$PWD/pre-services/keys/pk" | base64 | tr -d '\n'`'/' "/tmp/hyperledger-fabric-chaincode/offers/.env.default"
    sed -i 's/PK_PROXY_B64=.*/PK_PROXY_B64='`cat "$PWD/pre-services/keys/pk" | base64 | tr -d '\n'`'/' "/tmp/hyperledger-fabric-chaincode/transactions/.env.default"
    sed -i 's/PK_PROXY_B64=.*/PK_PROXY_B64='`cat "$PWD/pre-services/keys/pk" | base64 | tr -d '\n'`'/' "/tmp/hyperledger-fabric-chaincode/proofs/.env.default"

}


launch_hlf () {

    bnc generate --config-folder $PWD/hlf-config/hlf -f config-org2.yaml 
    bnc generate --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -g config-genesis-org1-org2.yaml

    bnc start --config-folder $PWD/hlf-config/hlf -f config-org2.yaml
    bnc start --config-folder $PWD/hlf-config/hlf -f config-org1.yaml

    sleep 10
}

deploy_channel () {

    bnc channel deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml 
    bnc channel deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml --no-create
    
    sleep 10
}

deploy_chaincode () {

    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_offers.yaml --policy
    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_offers.yaml --policy

    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_transactions.yaml --policy
    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_transactions.yaml --policy

    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_proofs.yaml --policy
    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_proofs.yaml --policy

    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org2.yaml -c config_kms.yaml --policy --private
    bnc chaincode deploy --config-folder $PWD/hlf-config/hlf -f config-org1.yaml -c config_kms.yaml --policy --private

    sleep 10
}

deploy_proxy () {

    docker-compose -f pre-services/docker-compose.yml up -d --build

    sleep 30

    curl -XPOST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "passphrase":  "top secret" }' http://localhost:3000/api/proxy/keys
   
    #sed -i 's/SK_PROXY_B64=.*/SK_PROXY_B64='`cat "$PWD/pre-services/keys/sk" | base64 | tr -d '\n'`'/' "$PWD/pre-services/.env"
    #docker-compose -f pre-services/docker-compose.yml up -d --build
}

deploy_api () {

    docker-compose -f api-services/docker-compose-org1.yaml up -d --build
    docker-compose -f api-services/docker-compose-org2.yaml up -d --build

}

if [ $# -ge 1 ]; then
    if [ "$1" = "clean" ]; then
        clean_all
    fi
    if [ "$1" = "init" ]; then
        deploy_proxy
    fi
    if [ "$1" = "build" ]; then
        build_chaincode
    fi
    if [ "$1" = "start" ]; then
        setup_chaincode
        launch_hlf
    fi
    if [ "$1" = "deploy" ]; then
        deploy_channel
        deploy_chaincode
    fi
    if [ "$1" = "run" ]; then
        deploy_api
    fi
else
    echo "Argument required: build, init, start, deploy, run, clean"
fi

