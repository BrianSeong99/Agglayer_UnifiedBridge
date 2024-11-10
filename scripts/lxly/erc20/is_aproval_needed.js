const { getLxLyClient, tokens, configuration, from } = require('../../utils_lxly');

const execute = async () => {
  const client = await getLxLyClient();
  const erc20Token = client.erc20(tokens[0].erc20, 0);
  const result = await erc20Token.isApprovalNeeded();
  console.log("result", result);

  // const erc20Token = client.erc20(tokens[0].ether, 0);
  // const result = await erc20Token.isApprovalNeeded();
  // console.log("result", result);

}
execute().then(() => {
}).catch(err => {
  console.error("err", err);
}).finally(_ => {
  process.exit(0);
});
