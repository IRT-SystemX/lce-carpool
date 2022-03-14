/* eslint-disable no-unused-vars */
const fs = require('fs');
const randomstring = require('randomstring');
const moment = require('moment');
const { validIdOperator, validTransactionType } = require('../../src/config');

function rmDir(dirPath, removeSelf) {
  if (removeSelf === undefined) removeSelf = true; // eslint-disable-line no-param-reassign
  const files = fs.readdirSync(dirPath);
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) { // eslint-disable-line no-plusplus
      // eslint-disable-next-line no-continue
      if (files[i] === '.gitkeep') continue;

      const filePath = `${dirPath}/${files[i]}`;
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  }
  if (removeSelf) fs.rmdirSync(dirPath);
}

function getRandomOffer() {
  const idOffer = randomstring.generate(7);
  return {
    "idOffer": idOffer,
    "idDriver": "739139",
    "idOperator": validIdOperator[0],
    "driverShortname": "BBob",
    "origin": "10 Allée du Vieux Chêne, 69380 Lissieu",
    "destination": "5 Avenue Tony Garnier, 69000 Lyon",
    "departureGPS": "45.843384,4.743948",
    "arrivalGPS": "45.730942,4.823909",
    "date": "2019-04-23T14:20:00Z",
    "price": 1.2,
    "availableSeats": 3,
    "driver": {
      "photo": "https://api.xxx.com/image/132279.jpeg",
      "age": 35,
      "note": 4,
      "identityVerified": true,
      "phoneVerified": true,
      "emailVerified": true,
      "lang": ["English", "French"]
    },
    "trip": {
      "distance": 17397,
      "duration": "1:20:20",
      "hasHighways": false,
      "departure": {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            4.827579,
            45.726635
          ]
        },
        "properties": {
          "source": "openstreetmap",
          "source_id": "polyline:268944",
          "name": "Avenue Tony Garnier",
          "country": "France",
          "country_gid": "whosonfirst:country:85633147",
          "macroregion": "Auvergne-Rhône-Alpes",
          "localadmin_gid": "whosonfirst:localadmin:404428859",
          "locality": "Lyon",
          "label": "Avenue Tony Garnier, Lyon, France",
          "layer": "street",
          "street": "Avenue Tony Garnier",
          "region_gid": "whosonfirst:region:85683569",
          "macrocounty": "1er Arr.",
          "country_a": "FRA",
          "macrocounty_gid": "whosonfirst:macrocounty:404227735",
          "locality_gid": "whosonfirst:locality:101749431",
          "continent_gid": "whosonfirst:continent:102191581",
          "gid": "openstreetmap:street:polyline:268944",
          "macroregion_gid": "whosonfirst:macroregion:1108826389",
          "localadmin": "7e Arr.",
          "id": "polyline:268944",
          "confidence": 0.8,
          "county": "1er Arr.",
          "match_type": "fallback",
          "accuracy": "centroid",
          "region": "Département du Rhône",
          "county_gid": "whosonfirst:county:102072419",
          "continent": "Europe"
        }
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
        "properties": {
          "source": "openstreetmap",
          "source_id": "polyline:268944",
          "name": "Avenue Tony Garnier",
          "country": "France",
          "country_gid": "whosonfirst:country:85633147",
          "macroregion": "Auvergne-Rhône-Alpes",
          "localadmin_gid": "whosonfirst:localadmin:404428859",
          "locality": "Lyon",
          "label": "Avenue Tony Garnier, Lyon, France",
          "layer": "street",
          "street": "Avenue Tony Garnier",
          "region_gid": "whosonfirst:region:85683569",
          "macrocounty": "1er Arr.",
          "country_a": "FRA",
          "macrocounty_gid": "whosonfirst:macrocounty:404227735",
          "locality_gid": "whosonfirst:locality:101749431",
          "continent_gid": "whosonfirst:continent:102191581",
          "gid": "openstreetmap:street:polyline:268944",
          "macroregion_gid": "whosonfirst:macroregion:1108826389",
          "localadmin": "7e Arr.",
          "id": "polyline:268944",
          "confidence": 0.8,
          "county": "1er Arr.",
          "match_type": "fallback",
          "accuracy": "centroid",
          "region": "Département du Rhône",
          "county_gid": "whosonfirst:county:102072419",
          "continent": "Europe"
        }
      },
      "path": "https://www.xxx.com/mon-annonce/2698609?isReturnSearch=null&returnSearchUrl=null"
    },
    "vehicle": {
      "photo": "https://api.xxx.com/image/xxx.jpeg",
      "brand": "Renault",
      "model": "Clio",
      "color": "Red",
      "availableSeats": 3
    }
  }
}

function getRandomBasicOfferEcov() {
  const idOffer = randomstring.generate(7);
  return {
    "idOffer": idOffer,
    "idDriver": "739139",
    "idOperator": validIdOperator[3],
    "driverShortname": "Bob",
    "origin": "10 Allée du Vieux Chene, 69380 Lissieu",
    "destination": "5 Avenue Tony Garnier 69000 Lyon",
    "departureGPS": "45.843384,4.743948",
    "arrivalGPS": "45.730942,4.823909",
    "startDate": moment().add('1', 'd').toISOString(),
    "endDate": moment().add('1', 'd').add('1', 'h').toISOString(),
    "price": 1.2,
    "availableSeats": 3,
    "test": "test",
    "tripDuration": "1:20:20"
  }
}

function getRandomBasicOffer() {
  const idOffer = randomstring.generate(7);
  return {
    "idOffer": idOffer,
    "idDriver": "739139",
    "idOperator": validIdOperator[1],
    "driverShortname": "Bob",
    "origin": "10 Allée du Vieux Chene, 69380 Lissieu",
    "destination": "5 Avenue Tony Garnier 69000 Lyon",
    "departureGPS": "45.843384,4.743948",
    "arrivalGPS": "45.730942,4.823909",
    "date": moment().add('1', 'd').toISOString(),
    "price": 1.2,
    "availableSeats": 3,
    "test": "test",
    "tripDuration": "1:20:20"
  }
}

function getRandomTransaction(idOffer=randomstring.generate(5),
  idOperator=validIdOperator[1],
  idOperatorPassenger=validIdOperator[0],
  type= validTransactionType[0]) {
  return {
    idOffer,
    idOperator, 
    idPassenger: randomstring.generate(3),
    passengerShortname: randomstring.generate(4),
    idOperatorPassenger,
    type
  };
}

function getTransactionForOffer(idOffer, idOperator=validIdOperator[1], idOperatorPassenger=validIdOperator[0], type= validTransactionType[0]) {
  return {
    idOffer,
    idOperator,
    idPassenger: randomstring.generate(3),
    passengerShortname: randomstring.generate(4),
    idOperatorPassenger,
    type
  };
}

function getMessage() {
  return {
    idOffer: randomstring.generate(4),
    idOperator: validIdOperator[0],
    idPassenger: 'xxx',
    passengerShortname: 'xxx',
    idOperatorPassenger: validIdOperator[1],
    messageTxt: 'The message text',
    createdAt: '1548851963'
  };
}




module.exports = {
  rmDir,
  getRandomOffer,
  getRandomBasicOffer,
  getRandomBasicOfferEcov,
  getRandomTransaction,
  getTransactionForOffer,
  getMessage
};
