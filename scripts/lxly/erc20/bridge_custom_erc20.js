const { getLxLyClient, tokens, configuration, from } = require('../../utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();
    // add corresponding adapter address for source network
    const token = client.erc20(tokens[0].erc20, 0, "adapterAddress");

    const result = await token.bridgeCustomERC20(100, from, 1);
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
