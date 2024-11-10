const { getLxLyClient, tokens, configuration, from } = require('../../src/utils_lxly');
const abi = require('./abi.json');

const execute = async () => {
    const client = await getLxLyClient();
    const customContract = client.contract(abi, "0xbe264257Be052BF867524D2640F6d5305d4263C8", 0);

    const tx = await customContract.write({ returnTransaction: false }, 'addValue');
    // const tx = await customContract.write({ returnTransaction: false }, 'addValue', 3);

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
