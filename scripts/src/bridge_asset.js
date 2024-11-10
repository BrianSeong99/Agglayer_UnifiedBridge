const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();

    const token = client.erc20(tokens[0].ether, 0);

    const result = await token.bridgeAsset("2000000000000000000", to, 1);
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
