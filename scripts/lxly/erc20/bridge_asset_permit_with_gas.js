const { getLxLyClient, tokens, configuration, from } = require('../../utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();

    // add token address which supports permit
    const token = client.erc20(tokens[0].erc20, 0);

    const result = await token.bridgeAssetPermitWithGas(100, from, 10, 1);
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
