const { getLxLyClient, tokens, configuration, from } = require('../../utils_lxly');

const execute = async () => {
    const bridgeTransactionHash = "abc";
    const client = await getLxLyClient();
    
    // add corresponding adapter address for destination network
    const token = client.erc20(tokens[1].erc20, 1, "adapterAddress");

    const result = await token.claimCustomERC20(bridgeTransactionHash, 0);
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
