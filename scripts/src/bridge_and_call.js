const { ethers } = require("ethers");
const { BridgeExtension } = require("../../ABIs/BridgeExtension");
const { Counter } = require("../../ABIs/Counter");
const { providers } = require("./utils/ethers_clients");
const config = require('../config');

const execute = async () =>{
    const BRIDGE_EXTENSION_ADDRESS = "0x2311BFA86Ae27FC10E1ad3f805A2F9d22Fc8a6a1";

    // set token as `eth`.
    const token = "0x0000000000000000000000000000000000000000";
    // not bridging any token this time
    const amount = "0"; 
    // because we are bridging from cardona.
    const sourceNetwork = 1; 
    // sending to zkyoto
    const destinationNetwork = 0;
    // prepare the call data for the counter smart contract on destination chain.
    const iface = new ethers.Interface(Counter);
    const callData = iface.encodeFunctionData("increment", [4]);

    const signer = new ethers.Wallet(config.user1.privateKey, providers[sourceNetwork]);

    // change it to the counter smart contract deployed on destination network.
    const callAddress = "0x43854F7B2a37fA13182BBEA76E50FC8e3D298CF1";
    // if transaction fails, then the funds will be sent back to user's address on destination network.
    const fallbackAddress = signer.address;

    const forceUpdateGlobalExitRoot = false;

    console.log("account", signer.address);

    bridgeExtensionContract = new ethers.Contract(BRIDGE_EXTENSION_ADDRESS, BridgeExtension, signer);

    await bridgeExtensionContract.bridgeAndCall(
        token,
        amount,
        destinationNetwork,
        callAddress,
        fallbackAddress,
        callData,
        forceUpdateGlobalExitRoot,
        { value: amount } // Match msg.value with amount for ETH
    ).then((result) => {
        console.log("result", result);
    })
}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
