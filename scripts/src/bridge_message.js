const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');
const { Bridge } = require('@maticnetwork/lxlyjs');

// Encode the amount into a uint256.
function encodeMetadata(amount) {
    return encodePacked(["uint256"], [amount]);
}

const execute = async () => {
    const client = await getLxLyClient();
    
    // change this with your smart contract deployed on destination network.
    const bridgeAddress = "0x0"; 

    // the destination Network ID for this example is spolia, therefore is 0.
    const destinationNetworkId = 0; 

    // Call bridgeMessage function.
    const result = await client.bridges[destinationNetworkId]
        .bridgeMessage(destinationNetworkId, bridgeAddress, true, encodeMetadata(2));
    const txHash = await result.getTransactionHash();
    console.log("txHash", txHash);
    const receipt = await result.getReceipt();
    console.log("receipt", receipt);
}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
