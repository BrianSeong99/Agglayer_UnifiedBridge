const { getLxLyClient, tokens, configuration, from } = require('../../utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();
    const globalIndex = await client.bridgeUtil.computeGlobalIndex(5886, 1, 0);
    console.log("globalIndex", globalIndex.toString());

}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
