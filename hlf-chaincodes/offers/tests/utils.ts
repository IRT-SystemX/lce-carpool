import moment = require('moment');
import {v4 as uuid} from 'uuid';
import {ChaincodeMockStub} from '@theledger/fabric-mock-stub';
import {OPERATORS} from '../src/utils';
import {Offer} from '../src/offer';
// @ts-ignore
import {KmsChaincode} from '../../kms/src/kmsChaincode';

// @ts-ignore
function momentRandom(end = moment(), start) {
  const endTime = +moment(end);
  const randomNumber = (to: number, from = 0) =>
      Math.floor(Math.random() * (to - from) + from);

  if (start) {
      const startTime = +moment(start);
      if (startTime > endTime) {
          throw new Error('End date is before start date!');
      }
      return moment(randomNumber(endTime, startTime));
  }
  return moment(randomNumber(endTime));
}

export function get_random_offer(): Offer {
  return {
      idOffer: uuid(),
      idOperator: OPERATORS.OVX,
      idDriver: uuid(),
      driverShortname: 'irt',
      origin: 'lyon',
      destination: 'paris',
      departureGps: 'lyon-gps',
      arrivalGps: 'paris-gps',
      date: momentRandom(moment('2019-01-31 10:15:34'), '2019-01-01 10:15:34').unix(),
      startDate: momentRandom(moment('2019-01-31 10:15:34'), '2019-01-01 10:15:34').unix(),
      endDate: momentRandom(moment('2019-01-31 17:15:34'), '2019-01-01 17:15:34').unix(),
      priceMax: 20,
      price: 15,
      availableSeats: 2,
      geohashLevel: 6,
      geohashDeparture: 'abcde',
      geohashArrival: 'drefg',
  };
}

export function get_random_offer_complete(): Offer {
  return {
      idOffer: uuid(),
      idDriver: uuid(),
      idOperator: OPERATORS.OVX,
      driverShortname: 'SOlivier',
      origin: 'Aire de covoiturage de Université Angers-Cholet, 49300 Cholet',
      destination: 'Gare de Nantes, 44000 Nantes',
      departureGps: '47.04917, -0.863509',
      arrivalGps: '47.216148, -1.542356',
      date: momentRandom(moment('2019-01-31 10:15:34'), '2019-01-01 10:15:34').unix(),
      startDate: momentRandom(moment('2019-01-31 10:15:34'), '2019-01-01 10:15:34').unix(),
      endDate: momentRandom(moment('2019-01-31 17:15:34'), '2019-01-01 17:15:34').unix(),
      price: 4.35,
      availableSeats: 3,
      geohashLevel: 6,
      geohashDeparture: 'abcde',
      geohashArrival: 'drefg',
      driverIdentityVerified: true,
      driverPhoto: 'http://xxx.test/image/133220.jpeg',
      tripDistance: 62.726,
      tripDuration: '2980',
      vehicleBrand: 'HYUNDAI',
      vehicleModel: 'GETZ',
      vehicleColor: 'user.car.color.blue1',
      vehicleAvailableSeats: 5,
      vehiclePhoto: 'http://xxx.test/image/133221.jpg'
  };
}

export const userCertOvx = '-----BEGIN CERTIFICATE-----' +
'MIICNDCCAdqgAwIBAgIUTzMvshyVpeM3HrBABgG9/4wHYhQwCgYIKoZIzj0EAwIw' +
'azELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh' +
'biBGcmFuY2lzY28xFTATBgNVBAoTDG9yZzEubGNlLmNvbTEYMBYGA1UEAxMPY2Eu' +
'b3JnMS5sY2UuY29tMB4XDTIwMDUyMzE4MzIwMFoXDTIxMDUyMzE4MzcwMFowLzEc' +
'MA0GA1UECxMGY2xpZW50MAsGA1UECxMEb3JnMTEPMA0GA1UEAxMGZHpvbmRhMFkw' +
'EwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYv5NBMztmoPzsPbKhpHuGtTIn60cnaiQ' +
't1E0EzSx11m14NE25q5PP0nwWp426/2i3gthZvc+x0J9gSqoAda5TqOBlzCBlDAO' +
'BgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUw2neBarFI6pp' +
'bFMsjTLV8boFpWswKwYDVR0jBCQwIoAgdcfyPZ7n1ct9X/Cz9RW3bb/diYPExEVp' +
'Vf8Sc1/unRowKAYIKgMEBQYHCAEEHHsiYXR0cnMiOnsib3BlcmF0b3IiOiJvdngi' +
'fX0wCgYIKoZIzj0EAwIDSAAwRQIhAOizFZ/kB82a57yCoqA0hPLWszqcP/+IrCkZ' +
'ibtdetPLAiBJhpG5H2vZgBVwO1wTqQ115W6fR1UaNqG0I+40nU9MTA==' +
'-----END CERTIFICATE-----';

export const userCertRidygo = '-----BEGIN CERTIFICATE-----' +
'MIICNzCCAd6gAwIBAgIULgcRlc6RcfuHOqNXsVwFHXI44/MwCgYIKoZIzj0EAwIw' +
'azELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh' +
'biBGcmFuY2lzY28xFTATBgNVBAoTDG9yZzEubGNlLmNvbTEYMBYGA1UEAxMPY2Eu' +
'b3JnMS5sY2UuY29tMB4XDTIwMDUyMzE4NTEwMFoXDTIxMDUyMzE4NTYwMFowMDEc' +
'MA0GA1UECxMGY2xpZW50MAsGA1UECxMEb3JnMTEQMA4GA1UEAxMHZHpvbmRhMjBZ' +
'MBMGByqGSM49AgEGCCqGSM49AwEHA0IABLvuIENcjAANH/PA6L2S1ChRw8fWGq61' +
'KaboqvEw1R+foznzMvz/shNaTFsJDVPZzwFgcJQYDtwftt8UUJhEI2mjgZowgZcw' +
'DgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFA3NyirK2Yvp' +
'34ZQbPMzMjOyMO/TMCsGA1UdIwQkMCKAIHXH8j2e59XLfV/ws/UVt22/3YmDxMRF' +
'aVX/EnNf7p0aMCsGCCoDBAUGBwgBBB97ImF0dHJzIjp7Im9wZXJhdG9yIjoicmlk' +
'eWdvIn19MAoGCCqGSM49BAMCA0cAMEQCIBoIdnWi1DkfuxH4yqx64idSrhpiwuxE' +
'BO1bg5Dnl36pAiB2Ym/odgJDca5yVPI18DSs8ILfYtIOr56DFFlwUf9PGQ==' +
'-----END CERTIFICATE-----';

export const pkOvx = 'BM4A80Pl8Ggl50LV8tYSImRXxsMlHjj8PMauHhMaxH3tOfKiKyzabuk9vYcv7Y9QhuoVqVZARP8ZJCn9sDIZMLw=';
export const skOvx = 'Y1+ZME+NflKDQkAAegaweCu05huYb6SIUT/dJ49YkFg=';
export const pkRidygo = 'BBxR81l/6aFW9iQeV6zL4FvFqLktJ0igqFUOj7W9ZhobLmH37N1NP2caDooymUdQQh81js0ditAHkeybUsyoLQ==';
export const skRidygo = 'T9xZlxkmxYdb8fPI4c6pVNjDRi7Vw+zqDmrvdN3nlAM=';

export function initPrivateData(stub: ChaincodeMockStub) {
  const kmsOvx = { docType: 'kms', idOperator: 'ovx', publicKey: pkOvx };
  const kmsOvxPrivate = { docType: 'kms', idOperator: 'ovx', privateKey: skOvx };
  const kmsRidygo = { docType: 'kms', idOperator: 'ovx', publicKey: pkRidygo };
  const kmsRidygoPrivate = { docType: 'kms', idOperator: 'ovx', privateKey: skRidygo };

  // Add ovx public key
  stub.mockTransactionStart('txOvxSharedCollection', new Map());
  stub.putPrivateData('sharedKmsCollection', 'ovx', Buffer.from(JSON.stringify(kmsOvx)));
  stub.mockTransactionEnd('txOvxSharedCollection');

  // Add ridygo public key
  stub.mockTransactionStart('txRidygoSharedCollection', new Map());
  stub.putPrivateData('sharedKmsCollection', 'ridygo', Buffer.from(JSON.stringify(kmsRidygo)));
  stub.mockTransactionEnd('txRidygoSharedCollection');

  // Add ovx private key
  stub.mockTransactionStart('txOvxSharedCollection', new Map());
  stub.putPrivateData('ovxPrivateKmsCollection', 'ovx', Buffer.from(JSON.stringify(kmsOvxPrivate)));
  stub.mockTransactionEnd('txOvxSharedCollection');

  // Add ridygo private key
  stub.mockTransactionStart('txRidygoSharedCollection', new Map());
  stub.putPrivateData('ridygoPrivateKmsCollection', 'ridygo', Buffer.from(JSON.stringify(kmsRidygoPrivate)));
  stub.mockTransactionEnd('txRidygoSharedCollection');
}

export async function initKmsChaincode(stub: ChaincodeMockStub) {
  const kmsName = 'kms/mychannel';
  const kmsChaincode = new KmsChaincode();

  const kmsMockStub = new ChaincodeMockStub(kmsName, kmsChaincode, userCertOvx);
  
  const kms = {
    idOperator: 'ovx',
    publicKey: pkOvx,
  };
  const kmsPrivate = new Map().set('privateKey', skOvx);

  const res = await kmsMockStub.mockInvoke('tx1', ['createKeys', JSON.stringify(kms)], kmsPrivate);

  stub.mockPeerChaincode(kmsName, kmsMockStub);

  return Promise.resolve(res);
}

export const encryptedOffer = { docType: 'offer',
idTrip:
 'a419d719f3a4acf5cf9bc5e16d8ce9bc7041c62289940c54bf050216305853d7084915532433ca4380d9e18a70ecc946fbf6f63c79e726db39cb98e74996d6b6',
metadata:
 'VA3iffIhIt1TfDN3HWTMLP8krUt+Oy0Zo21NM1Jrzu7G/fSEJ91Z1LMiCJOxJsG8PGHW1e56LfQL4PWt47Cnq2WnXa1g8RrQOGLJCLYpvAhmv/DbZcS1Doiv2SthCmf4llbr/BA+KdCFZNqwFQZrBBP/C4BX7UnjYH0Evu2ua/fGzpqrVoEwYEyqJ2s3aFRcbtHGVFkrU2Sn1T9MnkG/Xwx3xH1HE0Rz6m5/KmyEl4V23+0W8HK2RxHP5qkZdX8T+5qhdNVr1C6PmGsW4uQpqO8MYzhEY4zTaaenJcKlkNutSZk0H/3P1KJulOMkzl6unJ0rNvdw8G/0/PB1D5m0RgPDp+bV1xejl5ZZRSxPUUTq5w9cmIlf+zdypzuV3Yi6+6i/iHw8U4pitqZ1CwDWQZqzX/Izw6bHKQdxX1YAmIHuprmjw19NvV5r0mjipBnH2v8k+lUI2ghvrvkIoN6xAgCQmwoS3ZWRZg/JP0EM5SOZOjsV1jBk0D2KE/K2j6i+4meBj9dWZrN4M5shJ7MFniR3UEO7y/oTP0ZPSVPRF0169tpowtHvLsH8nmTvLqcsf+59+4N/KP3wT1bZK/1eiOLYdajBVmhXYOJRW2wmwDOnXw8Bl5dn8LwHEjetchpdSrb4ZGfJDAfxSzhpKjxu8UCQtQmsr8z2wUFrOml4skk=',
capsule:
 'BEAWNnc6ZdPlnqTVR+Okjay+6qAG6qIipSZn37wKQmJldYKAjl989ee7CY96tY/JoxyO59wi5grkxwLkN4WCPjwEr05H6HkvwvOcU6ZeifwRm9HrwhbWCtPNm/Dmyq3W/H/V5F1sx2NxAEG3wd2c80ww+/CMWVr+7N4FBrmlcUBfaxUdZCp3ePMZxFPbG5Y3xjNyWXPvSW84PX+fI0UyFC46',
entity:
 '6MJEAilFPawkk9cvQsE3GDTdnMBXV/2yd8ElFdF7kSSKhswj7H8oNE8kHcJsW0dumBV+I/ewQJpr/3OsUv0bXpH/H6NvD4xDDj9IzZ/vx3quCaabePXK0LouMlq6KuAOEQL76Az+Mqe4UIxyepNOA0VY0scGeYomhSqUpFF0UJCKghBpaSFZopSp5F5tnIqvbM6ts65RevRgL8txKev5yiq+v2XEzX3HYulznMeOHTOpbz1STsCG/u8QwN7cqOwQjDsg0xEpjbK+PA9YDhumIOPC/sZUAaTGu2zxTnwBSnXa2M8I3lBz8fcENZLwIi/iQWor0+teXxcvtidCsPycvatCFDOWs48BKzS9uUfxCBc7iyCkHZ0yOfk8jzmh/0LSUUANc6RAO9EDRW3BptSRJ4j/Nw7PfSMcZaBMiLSblDbbPlO3Z/yhEy+Iy8nruuqhvIwQqH9+qXBnDILDAG9MYrDx0oWcUekRBvEVovlCxdzD9dr39xk403+J8R5Jp24pRxPTKDaGb9BD6wun4rb7Yo7IEChftQ7IO3TjjaiAjzPfnq+23Ob9yL4XMal3mO+Z+3SiKEYHSz3kzqc/icaUus6yWXB2h9/Bzn413h1NBwGugT9LyhC9dCKEouQOHgyLWQg/7RySwsTEq32FaDHG1efYobxe+bjclvO+pCdXF340xyyo9yPszktwV6G9+F9Od1rpQXh30Mpci9yDTBHvR6xAN7YfIgmi+ySmYXSMMK33EKNbpcg3wan8xGPkfSpfkfsi96wxdurCOiL1RZpA4dKgR0sdCSEFzfPZQBZ0KmFZWoM5X3+OPFV0BbiaDBkFk7zwJt5QQP6EXW2pRyC+cGyd4qMMQS90Gacw8Z+T0ttecsEgKbR8RCTzAbgvEoPV2OSN38oByauYr/eq5rCfpKN1iBdRMZnXnO4Tz0E717K/pWYF1nefBitp0zK58j4iskopb/kmmCFWJG+7VjpdCR3q5MdNwjurA/dMSM9j2AtgGGQuJhk/8rQ0ctpaYXPSoC6AdTBTkejrtP+otBAjwkVqVrQBaZVoaSgBM7Awi3LC9KsFwTR7tHU7SREAF3zvIcL4/pxO+TzyeGxkkB+tDkeA+yPbNQHWNXKih+/SwyCuuvglLC0x2Buq6W8QsFu+hbFgjof7TgW4HhX2D9a/mQHevae4CTH8CuVPBPhF8RnYm+AMcmYMflL0GrAIQN1RHbT6gngWCPiQuFrI0NDPcg64ME4sIcleOOJDW+tlt7ZcsdoY1w8y76ACGniNVARA',
startDate: 1548738260,
endDate: 1546389959,
availableSeats: 3,
geohashDeparture: 'abcde',
geohashArrival: 'drefg' };

export const symmetricKeyOffer = [ 80,173,128,218,235,218,223,205,15,167,62,61,93,193,18,6,110,228,75,249,255,0,72,90,47,107,210,85,116,66,139,156 ];
