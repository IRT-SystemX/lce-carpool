import {ChaincodeMockStub} from '@theledger/fabric-mock-stub';
import {KmsChaincode} from '../../kms/src/kmsChaincode';

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

export const pkOvx = 'BLNzTCyJVqPBr9BcFcuLZpPa0IBhpEFNsbhWyppGTnvzHmgT7B9CB++d8stLY4zRknJhiId2mTqrxTXtwGJTgaY=';
export const skOvx = '2/9buEFZ1cJae3yuPfRA/OHeaVDXShuvSLVJXrseLJ0=';
export const pkRidygo = 'BMgp99zMeErPMmk+/u1xqRBh7HSsDr158P5PNEopXvYM22xULApkH6aa6Chycv1/WWGsKepP5enVZ8WU2/f/YCY=';
export const skRidygo = 'W+yIyxqBAcByCc7xEGk5RmGUgWAUJ3LzYfLUFb0RmWg=';

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