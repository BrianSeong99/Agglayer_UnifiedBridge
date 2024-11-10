const { getLxLyClient, tokens, configuration, from } = require('../../src/utils_lxly');
const abi =  require('./abi.json');

const execute = async () => {
    const client = await getLxLyClient();
    const customContract = client.contract(abi, "0xbe264257Be052BF867524D2640F6d5305d4263C8", 0);

    // const result = await customContract.read('owner');
    // const result = await customContract.read('randomValue');
    // const result = await customContract.read('randomValueByNumber', 4);
    const result = await customContract.read('claimableAmount');
    console.log("result", result);

}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
