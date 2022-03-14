# Test LCE platform

## JWT token support
We have introduced the notion of JWT token in order to secure the REST API endpoint calls.

Each operator have to generate its token and use it in future requests. In order to generate a JWT token, please execute:

````bash
curl -X POST "HOST/api/v1/auth/login" -H  "accept: application/json" -H  "Content-Type: application/json" -d "{  \"username\": \"xxx\",  \"idOperator\": \"xxx\"}"
````

This will return a response as follow:

````text
{
 username: 'xxx',
 idOperator: 'xxx',
 token: { 
   value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ik93TG9JIiwiaWRPcGVyYXRvciI6ImlkdnJvb20iLCJpYXQiOjE1NTQ4ODk3MTEsImV4cCI6MTU2MDA3MzcxMX0.4Z6KsAqlehZMtlkDRebCFXcFBmZPn_Ck7bXd8X_5RLY',
   exp: 1560073711,
   iat: 1554889711 
 } 
}
````

Note that:
- the field `token.value` is the current JWT token
- the field `token.exp` is the token expiration date represented at _Seconds Since the Epoch_
- the field `token.iat` is the token _issued at_ date represented also as _Seconds Since the Epoch_

Please keep in mind that the above login url is a dummy call, we use it only to generate the JWT token. This is done intentionally
to allow partner integrate the API with their existing Authentication mechanism (currently we are using the passportJS
 package which support all authentication strategies from password, OAuth1.0, OAuth2.0, openConnectID...)

### How to use JWT token

The generated above Bearer token is used as a normal authorization bearer token, for example:

````bash
curl -X POST "HOST/api/v1/offer" -H  "accept: application/json" -H  "Content-Type: application/json" -H "Authorization: Bearer JWT_TOKEN_VALUE" -d "xxxxx"
````

**N.B. : JWT tokens are stored in blockchain as well as in api side. If blockchain network in restarted, then JWT tokens are deleted from the Blockchain. Then, JWT stores in api layer must be deleted as well and new JWT tokens should be created.**

## Proxy re-encryption keys

Each operator have to generate their public and secret keys.

It'a worth to note that each operator have to use its jwt token and call the api through its dedicated port. In the reminder of tests we use 4000 for OP1 and 4001 for OP2. 

To generate PRE keys we use kms route.

In the request body the operator have just to indicate its name:
````text
{ "idOperator": "op1" }
````

Here a curl request for operator keys generation:

````bash
curl -XPOST --header "Authorization: Bearer JWT_TOKEN_VALUE_OP1" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperator": "op1" }' http://localhost:4000/api/v1/kms
curl -XPOST --header "Authorization: Bearer JWT_TOKEN_VALUE_OP2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperator": "op2" }' http://localhost:4001/api/v1/kms
````

Then, each operator can delegate other operators in order to allow them to retrieve its offers. 

To delegate operators we use kms/rekey route.

In the request body the operator have to indicate its name as well as the name of the operator to delegate:

````text
{ 
  "idOperatorDelegator" : "op1",
  "idOperatorDelegatee" : "op2"
}
````

Here a curl request for operator keys generation:

````bash
curl -XPOST --header "Authorization: Bearer JWT_TOKEN_VALUE_OP1" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperatorDelegator" : "op1", "idOperatorDelegatee" : "op2" }' http://localhost:4000/api/v1/kms/rekey
curl -XPOST --header "Authorization: Bearer JWT_TOKEN_VALUE_OP2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOperatorDelegator" : "op2", "idOperatorDelegatee" : "op1" }' http://localhost:4001/api/v1/kms/rekey
````

**N.B. : Operators keys are stored in each operator organisation. The delegation process generates re-ecryption keys which are stored in the proxy.**

**N.B. : All these keys are only generated for one time when the platform is launched. However, if the Blockchain or the proxy are restarted, they have to be generated again.**

## Carpooling scenario
We provide a test of a simple scenario: 
1. Op2 create an offer.
2. Op1 search for an offer.
3. Op1 book Op2 offer.
4. Op2 Confirm Op1 booking.

### 1. Offer Creation

A driver of Op2 propose an offer. To create an offer we use offer route.

The request body accept an array of offers. So, a list of offers can be created at the same time.

Here an example of an offer. Only offer details are required. Trip, vehicle and driver informations are optional.

````bash
{
  "offers": [
    {
      "idOffer": "1",
      "idDriver": "1",
      "idOperator": "op2",
      "driverShortname": "Alice",
      "origin": "Gare Part-Dieu - Villette, Lyon, France",
      "destination": "Place du Général de Gaulle, Jonage, France",
      "departureGPS": "45.7608118,4.8620245",
      "arrivalGPS": "45.7961286,5.045048",
      "date": "2022-06-10T10:00:00",
      "description": "op2 offer description",
      "price": 2.2,
      "availableSeats": 4,
      "driver": {
        "age": 30,
        "note": 4,
        "identityVerified": "true",
        "phoneVerified": "true",
        "emailVerified": "true",
        "lang" : ["English","French"]
      },
      "trip": {
        "distance": 17397,
        "duration": "1:20:20",
        "hasHighways": "false",
        "departure": {
           "type": "Feature",
           "geometry": {
           "type": "Point",
           "coordinates": [
              4.827579,
              45.726635
            ]
            },
            "properties":{}
        },
        "arrival": {
           "type": "Feature",
           "geometry": {
              "type": "Point",
              "coordinates": [
                 4.827579,
                 45.726635
              ]
            },
            "properties":{}
        }
               
      },
      "vehicle": {
        "photo": "https://api.xxx.com/image/xxx.jpeg",
        "brand": "Renault",
        "model": "Clio",
        "color": "Red",
        "availableSeats": 3
      }
    }
  ]
}
````

Below a curl request for offer creation:

````bash
curl -XPOST --header "Authorization: Bearer JWT_TOKEN_VALUE_OP2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "offers": [ { "idOffer": "1", "idDriver": "6846", "idOperator": "op2", "driverShortname": "Elsa", "origin": "Gare Part-Dieu - Villette, Lyon, France", "destination": "Place du Général de Gaulle, Jonage, France", "departureGPS": "45.7608118,4.8620245", "arrivalGPS": "45.7961286,5.045048", "date": "2022-06-10T10:00:00", "description": "op2 offer description", "price": 2.2, "availableSeats": 4, "driver": { "age": 30, "note": 4, "identityVerified": "true", "phoneVerified": "true", "emailVerified": "true", "lang" : ["English","French"]}, "trip": {"distance": 17397, "duration": "1:20:20", "hasHighways": "false",  "departure": { "type": "Feature", "geometry": { "type": "Point", "coordinates": [ 4.827579,45.726635 ] }, "properties":{} }, "arrival": { "type": "Feature", "geometry": { "type": "Point",  "coordinates": [ 4.827579, 45.726635 ] }, "properties":{} } }, "vehicle": {  "photo": "https://api.xxx.com/image/xxx.jpeg", "brand": "Renault", "model": "Clio", "color": "Red", "availableSeats": 3 } } ] }' http://localhost:4001/api/v1/offer
````
### 2. Search offer

A passenger of Op1 is looking for an offer. To search an offer, the passenger indicate the origin, the destination and the date.

To search an offer, offer route is used. GPS coordinates of origin and destination as well as the date are added as parameters to the request path.

Below a curl request to search a request:

````bash
curl -XGET --header "Authorization: Bearer JWT_TOKEN_VALUE_OP1" --header 'Content-Type: application/json' --header 'Accept: application/json' "http://localhost:4000/api/v1/offer?origin=45.7608118,4.8620245&date=2021-06-10T09:00:00&destination=45.7961286,5.045048"
````

### 3. Book offer

The passenger of Op1 is interested by Op2 offer and book it.

To book an offer the route transaction is used.

A post request with booking details and _INSCRIPTION_ type is then sent. This is the request body.

````bash
{
    "idOffer": "1",
    "idOperator": "op2",
    "idPassenger": "1",
    "passengerShortname": "bob",
    "idOperatorPassenger": "op1",
    "type": "INSCRIPTION"
}
````

Below a curl request to book an offer:

````bash
curl -XPOST --header "Authorization: Bearer JWT_TOKEN_VALUE_OP1" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOffer": "1", "idOperator": "op2", "idPassenger": "1", "passengerShortname": "bob", "idOperatorPassenger": "op1", "type": "INSCRIPTION" }' http://localhost:4000/api/v1/transaction
````

This request return an idTransaction which can be used to track booking status.

NB: Op2 should receive a notification when the offer is booked. To this end, op2 must provide a webhook to be set in api ``.env.default`` file (parameter OP2_WEBHOOKS).

### 3. Confirm booking

The driver of Op2 confirms the booking of Op1 passenger.

To confirm a booking the route transaction is used.

A post request with booking details and _CONFIRMATION_ type is then sent. This is the request body.

````bash
{
    "idOffer": "1",
    "idOperator": "op2",
    "idPassenger": "1",
    "passengerShortname": "bob",
    "idOperatorPassenger": "op1",
    "type": "CONFIRMATION"
}
````

Below a curl request to confirm a booking:

````bash
curl -XPOST --header "Authorization: Bearer JWT_TOKEN_VALUE_OP2" --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{ "idOffer": "1", "idOperator": "op2", "idPassenger": "1", "passengerShortname": "bob", "idOperatorPassenger": "op1", "type": "CONFIRMATION" }' http://localhost:4001/api/v1/transaction
````

NB: Same here, in order to reveive confirmation notification, op1 must provide a webhook to be set in api ``.env.default`` file (parameter OP1_WEBHOOKS).

## Test other requests
Please refer to api [swagger](api-services/swagger.yaml) in file ``api-services/swagger.yaml`` to discover all provided APIs.