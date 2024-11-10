const { getLxLyClient, tokens, configuration, from } = require('../../utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();
    const erc20Token = client.erc20(tokens[0].erc20, 0);

    const result = await erc20Token.transfer(100, to, {
        gasPrice: '30000000000',
    });

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
