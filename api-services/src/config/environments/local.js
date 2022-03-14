module.exports = {
  hlf: {
    peerUrl: `grpc://192.168.71.130:7051`,
    ordererUrl: `grpc://192.168.71.130:7050`,
    ca: {
      url: `http://192.168.71.130:7054`,
      name: `ca.org2.lce.com`

    },
    admin: {
      MspID: `org2MSP`
    },
  }
};