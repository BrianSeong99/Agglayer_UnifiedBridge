const BridgeExtension = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "type": "error",
    "name": "AmountDoesNotMatchMsgValue"
  },
  {
    "inputs": [],
    "type": "error",
    "name": "InvalidAddress"
  },
  {
    "inputs": [],
    "type": "error",
    "name": "InvalidDepositIndex"
  },
  {
    "inputs": [],
    "type": "error",
    "name": "OriginMustBeBridgeExtension"
  },
  {
    "inputs": [],
    "type": "error",
    "name": "SenderMustBeBridge"
  },
  {
    "inputs": [],
    "type": "error",
    "name": "UnclaimedAsset"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "version",
        "type": "uint8",
        "indexed": false
      }
    ],
    "type": "event",
    "name": "Initialized",
    "anonymous": false
  },
  {
    "inputs": [],
    "stateMutability": "view",
    "type": "function",
    "name": "bridge",
    "outputs": [
      {
        "internalType": "contract PolygonZkEVMBridgeV2",
        "name": "",
        "type": "address"
      }
    ]
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "destinationNetwork",
        "type": "uint32"
      },
      {
        "internalType": "address",
        "name": "callAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "fallbackAddress",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "callData",
        "type": "bytes"
      },
      {
        "internalType": "bool",
        "name": "forceUpdateGlobalExitRoot",
        "type": "bool"
      }
    ],
    "stateMutability": "payable",
    "type": "function",
    "name": "bridgeAndCall"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "bridge_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function",
    "name": "initialize"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "originAddress",
        "type": "address"
      },
      {
        "internalType": "uint32",
        "name": "originNetwork",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "stateMutability": "payable",
    "type": "function",
    "name": "onMessageReceived"
  }
]

module.exports = {
  BridgeExtension
}