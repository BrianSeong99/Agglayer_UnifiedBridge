const { getLxLyClient, tokens, configuration, from } = require('./utils/utils_lxly');

const execute = async () => {
    const bridgeTransactionHash = "0xa0c21ccb392f56a9768a1e6741b04fbd9353acb26f3c0fc04f9d24d7977f9351";
    const client = await getLxLyClient();

    const token = client.erc20(tokens[1].ether, 1);

    const result = await token.claimAsset(bridgeTransactionHash, 0, {returnTransaction: false});
    console.log("result", result);
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
