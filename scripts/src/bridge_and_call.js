import { encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import BridgeExtension from "../../ABIs/BridgeExtension";
import Counter from "../../ABIs/Counter";
import publicClients from "./utils/viem_clients";

// Encode the amount into a uint256.
function encodeMetadata(amount) {
    return encodePacked(["uint256"], [amount]);
}

const execute = async () =>{
    const BRIDGE_EXTENSION_ADDRESS = "0x2311BFA86Ae27FC10E1ad3f805A2F9d22Fc8a6a1";

    const account = privateKeyToAccount(`0x${process.env.USER1_PRIVATE_KEY}`);

    // because we are bridging from cardona.
    const sourceNetwork = 1; 

    // set the lx token as `eth`.
    const lxToken = "0x0000000000000000000000000000000000000000";
    const amount = "0"; // not bridging any token this time
    const destinationNetwork = 2; // sending to zkyoto
    const callAddress = "0x..."; // change it to the counter smart contract deployed on zkyoto.
    const fallbackAddress = account.address; // if transaction fails, then the funds will be sent back to user's address on destination network.
    // prepare the call data for the counter smart contract on destination chain.
    const callData = encodeFunctionData({
        abi: Counter,
        functionName: 'increment',
        args: ['0x3']
    });
    const forceUpdateGlobalExitRoot = true;

    const { request } = await publicClients[sourceNetwork].simulateContract({
        address: BRIDGE_EXTENSION_ADDRESS,
        abi: BridgeExtension,
        functionName: "bridgeAndCall",
        args: [
            lxToken,
            amount,
            destinationNetwork,
            callAddress,
            fallbackAddress,
            callData,
            forceUpdateGlobalExitRoot
        ],
        account,
        value: amount,
    });

    const result = await client.writeContract(request);
    console.log("result", result);;
}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
