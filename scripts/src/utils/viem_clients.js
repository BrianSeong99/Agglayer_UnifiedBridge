import { createPublicClient, http } from "viem";
import { astarZkyoto, polygonZkEvmCardona, sepolia } from "viem/chains";

export default [
    createPublicClient({
        chain: sepolia,
        transport: http(),
    }),
    createPublicClient({
        chain: polygonZkEvmCardona,
        transport: http(),
    }),
    createPublicClient({
        chain: astarZkyoto,
        transport: http(),
    }),
];
