const { getLxLyClient } = require('../../src/utils_lxly');

const execute = async () => {
    const bridgeTransactionHash = "0xd2cd7b4faf3b07da4fc3057598961cdf070061d4cf6dd6ff262c95424a0b9796";

    const client = await getLxLyClient();

    const isBridgeClaimable = await client.isBridgeClaimable(bridgeTransactionHash, 0);
    console.log("isBridgeClaimable", isBridgeClaimable);
}
execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
