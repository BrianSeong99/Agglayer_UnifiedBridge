const Counter = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "count",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "increment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
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
				"name": "metadata",
				"type": "bytes"
			}
		],
		"name": "onMessageReceived",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	}
]

module.exports = {
	Counter
}