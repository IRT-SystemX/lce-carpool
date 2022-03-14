#!/bin/sh
#set -ex

ID_OFFER="1"
DATE_OFFER=`date '+%Y-%m-%dT%H:%M:%S'`

login () {

    TKN1=`curl -XPOST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "username": "user_test", "idOperator": "op1" }' http://localhost:4000/api/v1/auth/login | jq -r .token.value`
    TKN2=`curl -XPOST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "username": "user_test2", "idOperator": "op2" }' http://localhost:4001/api/v1/auth/login | jq -r .token.value`
}

kms () {

    curl -XPOST --header "Authorization: Bearer $TKN1" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperator": "op1" }' http://localhost:4000/api/v1/kms
    curl -XPOST --header "Authorization: Bearer $TKN2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperator": "op2" }' http://localhost:4001/api/v1/kms
}

delegate () {

    curl -XPOST --header "Authorization: Bearer $TKN1" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperatorDelegator" : "op1", "idOperatorDelegatee" : "op2" }' http://localhost:4000/api/v1/kms/rekey
    curl -XPOST --header "Authorization: Bearer $TKN2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperatorDelegator" : "op2", "idOperatorDelegatee" : "op1" }' http://localhost:4001/api/v1/kms/rekey
}

post () {

    curl -XPOST --header "Authorization: Bearer $TKN2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "offers": [ { "idOffer": "'$ID_OFFER'", "idDriver": "6846", "idOperator": "op2", "driverShortname": "Elsa", "origin": "Gare Part-Dieu - Villette, Lyon, France", "destination": "Place du Général de Gaulle, Jonage, France", "departureGPS": "45.7608118,4.8620245", "arrivalGPS": "45.7961286,5.045048", "date": "'$DATE_OFFER'", "description": "op2 offer description", "price": 2.2, "availableSeats": 4, "driver": { "age": 30, "note": 4, "identityVerified": "true", "phoneVerified": "true", "emailVerified": "true", "lang" : ["English","French"] }, "trip": {"distance": 17397, "duration": "1:20:20", "hasHighways": "false",  "departure": { "type": "Feature", "geometry": { "type": "Point", "coordinates": [ 4.827579,45.726635 ] }, "properties":{} }, "arrival": { "type": "Feature", "geometry": { "type": "Point",  "coordinates": [ 4.827579, 45.726635 ] }, "properties":{} } }, "vehicle": {  "photo": "https://api.xxx.com/image/xxx.jpeg", "brand": "Renault", "model": "Clio", "color": "Red", "availableSeats": 3 } } ] }' http://localhost:4001/api/v1/offer
    
}

search () {

    curl -XGET --header "Authorization: Bearer $TKN1" --header 'Content-Type: application/json' --header 'Accept: application/json' "http://localhost:4000/api/v1/offer?origin=45.7608118,4.8620245&date=2021-06-10T09:00:00&destination=45.7961286,5.045048"
    
    #curl  -XGET --header "Authorization: Bearer $TKN1" -XGET http://localhost:4000/api/v1/offer/op2/$ID_OFFER
}

txBook () {

    curl -XPOST --header "Authorization: Bearer $TKN1" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOffer": "'$ID_OFFER'", "idOperator": "op2", "idPassenger": "1", "passengerShortname": "alice", "idOperatorPassenger": "op1", "type": "INSCRIPTION" }' http://localhost:4000/api/v1/transaction


    #curl -XGET http://localhost:4000/api/v1/transaction/op2/1
    #curl -XGET http://localhost:4000/api/v1/transaction/d345d35d4a8625ee9a7002727e28a6e35348442b60de39ee80a16e1f1c6d04785d14aff37100711f679340811ded8bb51c8c6800ea9780f3cd2f76caa08de22e
}

txConfirm () {

    curl -XPOST --header "Authorization: Bearer $TKN2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOffer": "'$ID_OFFER'", "idOperator": "op2", "idPassenger": "1", "passengerShortname": "alice", "idOperatorPassenger": "op1", "type": "CONFIRMATION" }' http://localhost:4001/api/v1/transaction

    #curl -XGET http://localhost:4000/api/v1/transaction/op2/1
    #curl -XGET http://localhost:4000/api/v1/transaction/d345d35d4a8625ee9a7002727e28a6e35348442b60de39ee80a16e1f1c6d04785d14aff37100711f679340811ded8bb51c8c6800ea9780f3cd2f76caa08de22e
}


reencrypt () {
    curl -XGET --header "Authorization: Bearer $TKN1" --header 'Content-Type: application/json' --header 'Accept: application/json' http://localhost:4000/api/v1/kms/op2
    curl -XGET --header "Authorization: Bearer $TKN1" --header 'Content-Type: application/json' --header 'Accept: application/json' http://localhost:4000/api/v1/kms/op1

    #curl -XPOST --header "Authorization: Bearer $TKN1" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{"idOperator": "op2",    "entities":[{"docType": "application/json",   "metadata": "ihS9inkuUKVI4RP2eG8aO2WtAW1rmz/TD1ynaoJYPA6Z4fEPOpjhdRz3EV/8Wky31V3jZ4Z5EehApt9vFYNxkionMzJtM7OxoliLGPWuVUFVgWeBEZ0pn4hBvVwmXrRMM7nXb10yM+2LjaOIVm0Vr91FW+qe+JCp+pkEv3R0rSFfWt0Oaio+B8z8OLuI+jc5XI6NOiLwEvGofuFclAcSFQcgVgEXP2VuBWaMda4G4KnwdssZ9qdMHBUXes2sXBLlfd8wv1ltyOMfOjd4li8ak9F6GTF4kppK4NHzf8phF/gORErNHS9CgPkv1SSiROOyq5957omNOqGRmrbMjr+my0B2OzjyboWXs8QtcQtCHwDVlRfHAamtjKy027QF3rVwP8DDFLP9npH1g0YiiN4xSM2a3xIMcOhYlAhCPV14FyOPJSr+I4cNeMRiaEqawa+EzL8VGEL47SkQ6tJYAqg3XLgNTkVLnQQzzMDpD8qKeWx+1rPN4dOZKOAOc4ah2qu9lgNXctXibI4yU0Lqx8sJOmSD7PVYnLIZyOa479FH0ZNMLlSybgudlkSoYhzCbjo0qeRUkujNFY4kANDc+VJ2sq6Iw178zrSsOyFely6LSYJtmIVuOzV3lvuuZ6Xe5KxC37Yzi2WbzVdhcVueJfx8C9MEZmVUsl7g4S4tA0syN0E=",  "capsule": "BJFAD0X5SXgXVowu5HdElAFpMVkRFwX8Cc+wszUg+KhCiIVcvkcDcnH1oyMBJX2jHPiYysEAo71LLh60MdIHoGUEpVeJpw2xF2nKxakBYZDTvEP3D2cZaJSB76QuOvGgswj1jsvLTkmD4gEBiJ5mbUEuVkCKBxkdAmavanFa/VweFlhtfy2j/qOGs1NCig3XUUUcKwZyE9WhqkVL67fH5c1m",  "entity": "0x9WvAdK1tWuhHkaU52bdcXYuMkKVavbz0Y7XLvYD0WqPn5ZiUgfrqrMXFWhkTrKi5XXQuN1BP+B6xNA9TZd+H8LaXqIWD4Lp2Zvl2wafjDEgjJuIymX4U7JdZSOjha9OkhjXvUjBCfd7Rt5AMIq3HOTQhEqOjH5/xDd4KDo44kNWUWb5BXWG+3vNJGF2Da7hYb6ewSaVHIZ+fskJKMIKJR3dDyStjM8wIy86YoK2t8s/9wNIvS2vF0ifnr5zGfrnSpCZx0OlhG3VO3gFuyXhyggRxjf6p8Ixf6OAmQVLMIt4PxmiC20lpSMIh0nGxpRf6nIhpPOqtM+VuygA4diLAzAtC79mcEpNmIfzuxlplsh0fjAZ4G9rvVPTv77s7HnozQH9h2aWYGhwwooiCm9KEuDKFtWGvk3QHhRUQCfAoN8JzURrphKtjKMbAvLHrR/lTVIZkTDzabZpoRfTc71KAl8ntaz6LjTArSnSMnt7RKx50jDkdo3pcmEi13Burg+Q0YdM+/9a5OdHnOd2Td3Ep//DKdDJ+XH2nrNE7bQDSOKhAeFUVboSxI0C9mcWsDvgIAGKby+CJvseSxMW5Y9bnYktKylJqo/pMG0ywu3J16e93c0zVc4wfFNTtEJqL6shfeazOjd1Vl909JnQjzVQjcQS+u4fuVFyC87k0X2fOl79KgOuOIg6wXOB9HZPmEcy3Xz72E1WeETDjMgu7b8oNbeO+aTTaFTKwrbgSkDqhNjJwFGD1rWbXJkHJEQFLKD/2qSrFqjSrLWMxPAUXrnaRZb7x/RzRxq3vN1ttmrDNL7ELi1MwvC0qYn4URX1piNQLlaROcfd10S7EZmLjolR2RSkhRdqOkr8/QSblyoupnjNIk3a+43hOOpEQSxwAZPB40X3lWSRy49JwDXVjrj6vRMKRTwI5XqaGJEHkpoKqW6w0RU7aEaE1DMl+YTcqZtQBGf/3VTx/c+AHaZI7CH/Y5Z+j6qienfejHJfH9I2+VgRY/Rm0186FCHMnWpJS7H1EBp6/Y+uFwIlDgMu4VJyipRTeJWoeKEME24uIz+mLta6LLHVeiL8vKx5Z2ToE1sipLlkKJUe0FHajFkdp/lQxFZRI6W3azdLuPiz0LwMRy5fZyHGhwzE/aF521LEHzX3wkZjl4vUJyXs6k8WwS1Ikxt8/2yZVj5pxwujLZGpaYbLLQ9PPN0Nn1zjmXcqVft46fFlBej3VGKuSLzyEjn3gf3sHjF26wlgLyWFDOxjqzoFPzEoI1CP8tiduHZGHub6bRYhj3to9a18cd9qEHuQq8z6lEIxxc7li42bzSEJtPOxntKJ/LCAhajPxtFzCvGoV71AG/rEXKvL6Hd//Hoe/yMYWS68XsHWCNtjv6WdtemvB+S+MKxX4TuVmtoFJQKT9HovDk12vFHhsXxdoPjIRSi0XgN4Az/0Jrt5x0lIOHNTN/Wf26OYznziB1iBbYbBgOwa0U4sXkgRndHzXP90ROjJStXEDV9M+8HV7kMtDeVhJNycW2D/utLgrDux/xcl5doFiQCJz8E9/uewSjjHIrwqyb7sJLlia9KyqtVEp7pd6qhRguvNa2T2ZtXtK06+zpyAai3MZLQ0DF+yEGiuQ=="}]}' http://localhost:3000/api/proxy/reencrypt
}

prepare () {
    login
    kms
    delegate
}
test () {
    login
    post
    search
}

testTransaction () {
    login
    txBook
    txConfirm
}

prepare
test
