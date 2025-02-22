# Unified Bridge & Bridge-and-Call

<div align="center">
  <p align="center">
    <a href="http://makeapullrequest.com">
      <img alt="pull requests welcome badge" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat">
    </a>
    <a href="https://twitter.com/BrianSeong99">
      <img alt="Twitter" src="https://img.shields.io/twitter/url/https/twitter.com/BrianSeong99.svg?style=social&label=Follow%20%40BrianSeong99">
    </a>
  </p>
</div>

This repo explains the design and usage of Unified Bridge and Bridge-and-Call.

**Table of Contents**

- [Unified Bridge \& Bridge-and-Call](#unified-bridge--bridge-and-call)
- [Architecture of the Unified Bridge](#architecture-of-the-unified-bridge)
  - [0. Background](#0-background)
    - [L2s and Fragmentation](#l2s-and-fragmentation)
    - [What is AggLayer](#what-is-agglayer)
  - [1. Introduction to Unified Bridge](#1-introduction-to-unified-bridge)
    - [Why do we need Unified Bridge](#why-do-we-need-unified-bridge)
  - [2. Data Structure in Unified Bridge](#2-data-structure-in-unified-bridge)
    - [Local Exit Root \& Local Index](#local-exit-root--local-index)
    - [Rollup Exit Root](#rollup-exit-root)
    - [Mainnet Exit Root](#mainnet-exit-root)
    - [Global Exit Root, L1 Info Tree, Global Index:](#global-exit-root-l1-info-tree-global-index)
  - [3. Unified Bridge Components](#3-unified-bridge-components)
    - [Unified Bridge Contracts](#unified-bridge-contracts)
    - [Bridge Service](#bridge-service)
    - [Tools](#tools)
  - [4. Bridging Interface in Unified Bridge](#4-bridging-interface-in-unified-bridge)
    - [Assets Bridging](#assets-bridging)
    - [Message Bridging](#message-bridging)
  - [5. Bridge-and-Call](#5-bridge-and-call)
    - [Bridge-and-Call Components](#bridge-and-call-components)
  - [6. Bridging Interface in Bridge-and-Call](#6-bridging-interface-in-bridge-and-call)
    - [BridgeExtention.sol](#bridgeextentionsol)
    - [JumpPoint.sol](#jumppointsol)
  - [7. Security of Unified Bridge](#7-security-of-unified-bridge)
- [Using it as a Developer](#using-it-as-a-developer)
  - [L1 -\> L2 using `BridgeAsset` interface in `Lxly.js`:](#l1---l2-using-bridgeasset-interface-in-lxlyjs)
    - [Flow for L1 -\> L2 Bridging Transactions](#flow-for-l1---l2-bridging-transactions)
    - [Code Walkthrough](#code-walkthrough)
  - [L2 -\> L1 using `BridgeMessage` interface in `Lxly.js`:](#l2---l1-using-bridgemessage-interface-in-lxlyjs)
    - [Flow for L2 -\> L1 Bridging Transactions](#flow-for-l2---l1-bridging-transactions)
    - [Code Walkthrough](#code-walkthrough-1)
  - [L2 -\> L2 using `Bridge-and-Call` in Lxly.js:](#l2---l2-using-bridge-and-call-in-lxlyjs)
    - [Flow for L2 -\> L2 Bridging Transactions](#flow-for-l2---l2-bridging-transactions)
    - [Code Walkthrough](#code-walkthrough-2)
- [FAQ](#faq)
- [Reference](#reference)


# Architecture of the Unified Bridge

## 0. Background

### L2s and Fragmentation 
As more L2 chains emerge, a key challenge is ecosystem fragmentation. Fragmentation occurs when various L2s operate in silos, each with its own transaction processing, user base, and protocols. This creates several issues:

1. **Liquidity Fragmentation**: Liquidity is spread across multiple L2s, making it challenging to access a unified pool of assets when transacting. Users on one L2 cannot easily interact with assets on another, which reduces overall liquidity effectiveness.
2. **User Experience (UX) Issues**: Users must bridge assets across multiple L2s and adapt to different wallets, transaction formats, and fee structures, leading to a fragmented user experience. This can discourage adoption and reduce ease of access.
3. **Developer Complexity**: Developers must often build custom infrastructure for each L2, which increases development costs and creates inconsistent experiences across L2s. Standardization is difficult, and ensuring cross-L2 compatibility can be resource-intensive.
4. **Security Risks**: Fragmented systems increase potential attack vectors, as users rely on multiple bridges, sequencers, and contracts. Any vulnerability in one L2 can potentially affect assets and users across the ecosystem.
5. **Coordination Challenges**: Governance and decision-making across different L2s can be disjointed, making it hard to create a unified approach to updates, standards, or improvements. This could hinder the collective growth of the ecosystem.

### What is AggLayer

The AggLayer serves as an interoperability layer for cross-chain interactions among the chains connected to it. The AggLayer provides trustless messaging and liquidity sharing across connected chains, making it a more specialized protocol that focuses on asset than general-purpose protocols. However, it is not just a bridge; it's designed to handle native asset transfers and cross-chain execution, providing high security and low latency for connected chains. 

## 1. Introduction to Unified Bridge

The Unified Bridge (Prev. LxLy bridge) is an interoperability layer aimed at enabling cross-chain communication among AggLayer connected chains. It enables the interaction between different networks such as L2 to L2, L1 to L2, and L2 to L1.

### Why do we need Unified Bridge

Unified Bridge is needed to enable cross-chain communication among different networks to solve the problem of fragmentation as well as to initiate one-step cross-chain transactions for seamless UX.

For **AggLayer**, it is a critical component to facilitate unified experience among the chains that are connected to AggLayer. In the process of cross-chain communication, Unified Bridge is the interface for developers, users to initiate the cross-chain transactions, then AggLayer will monitor and validate the validity of the cross-chain message via Pessimistic Proof (We will talk about it in another tutorial), then once the validation passes, the cross-chain message will be accepted and ready to be claimed on the destination chain.

## 2. Data Structure in Unified Bridge

The entire data structure of Unified Bridge Looks like this, we will explain each part in detail.
![Unified Bridge Data Structure](./pics/UnifiedBridgeTree.png)

AggLayer is maintaining a giant merkle tree like this to record all the cross-chain transactions, verify the validity of all cross-chain transactions, making sure source chain transaction is indeed finalized on L1 before claiming on the destination chain.

### Local Exit Root & Local Index

All cross-chain transactions using the Unified Bridge are recorded in a Sparse Merkle Tree called Local Exit Tree. Each AggLayer connected chain maintains its own local exit tree. This is maintained in [`PolygonZKEVMBridgeV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMBridgeV2.sol) on each AggLayer connected L2 and L1.

- `Local Exit Root(LET)`: The root of the tree is called the local exit root. It is a binary tree and has the height of 32. The root is updated every time a new cross-chain transaction is initiated.

- `depositCount(Local Root Index)`: The index of the leaf node, per leaf node is a hash of cross-chain transaction such as `bridgeAsset`/`bridgeMessage`.

![LET](./pics/LET.png)

### Rollup Exit Root

`rollupExitRoot` is the merkle root of all L2s' Local Exit Root. All AggLayer connected L2s constantly update their Local Exit Root in [`PolygonRollupManager.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonRollupManager.sol), which updates the Rollup Exit Sparse Merkle Tree.

When there's new cross-chain transactions initiated on the Source Chain, is the chain's responsibility to submit its LET to the `RollupManager` smart contract on L1. The frequency is up to the L2, whether they submit the new LET for every new cross-chain transaction immediately, or maybe accumulate a certain number of cross-chain transactions before submitting the LET with the number of cross-chain transactions included.

Once the RollupManager has updated a `localExitRoot` of an L2, it will then update the `rollupExitRoot` on it, which will then update the `globalExitRoot` on [`PolygonZkEVMGlobalExitRootV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMGlobalExitRootV2.sol) on L1.

![RER](./pics/RET.png)

### Mainnet Exit Root

`mainnetExitRoot` is the same thing as Local Exit Root, but it is maintained on L1, which tracks the Bridging activities of L1 to all AggLayer connected L2s. When Mainnet Exit Root is updated on `PolygonZKEVMBridgeV2.sol` contract on L1, it will then update the `mainnetExitRoot` on [`PolygonZkEVMGlobalExitRootV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMGlobalExitRootV2.sol) on L1.

![L1MET](./pics/L1MET.png)

### Global Exit Root, L1 Info Tree, Global Index:

`globalExitRoot` is basically the hash of `rollupExitRoot` and `mainnetExitRoot`. Whenever there's new RER or MER submitted to [`PolygonZkEVMGlobalExitRootV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMGlobalExitRootV2.sol), it will append the new GER to the L1 Info Tree. L2 syncs L1's latest GER by calling `updateExitRoot` function in [`PolygonZkEVMGlobalExitRootL2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/PolygonZkEVMGlobalExitRootL2.sol) on L2.

`L1InfoTree` is the Sparse Merkle Tree that maintains the GERs. It is a binary tree and has the height of 32. The root is updated every time a new GER is submitted.

`Global Index` to locate the unique leaf in the new global exit tree. It is used when creating and verifying the SMT proof. It is a 256-bit string composed of unused bits, mainnet flag, rollup index bits, and local root index bits. Starting from the most significant bit, consists of the following bits:
- **191 bits of unused bits**: These bits are unused, and can be filled with any value. The best option is to fill them with zeros because zeros are cheaper.
- **1 bit of mainnet flag**: This single bit serves as a flag indicating whether an exit pertains to a rollup (represented by 0) or the mainnet (indicated by 1).
- **32 bit of the rollup Index**: These bits indicate the specific rollup being pointed at, within the rollup exit tree. These bits are therefore only used whenever mainnet flag is 0.
- **32 bits of the local root index**: These bits indicate the specific index being pointed at, within each rollup’s local exit tree.

![L1InfoTree](./pics/L1InfoTree.png)

## 3. Unified Bridge Components

There are two main components of Unified Bridge, the on-chain contracts, and the off-chain services, and additional tools to help interact with Unified Bridge. Let's go through them one by one.

### Unified Bridge Contracts

The core of the service that acts as the interface for developers, users to initiate the cross-chain transactions, and facilitate contract calls on the destination chain if specified. It is deployed on both source and destination chains.

Consists of important [contracts](https://github.com/0xPolygonHermez/zkevm-contracts/tree/main/contracts):
- `PolygonZKEVMBridgeV2.sol`: Bridge contract on both L1 and L2, maintains its own LET. It is the access point for all cross-chain transactions, including `bridgeAsset`, `bridgeMessage`, `claimAsset`, and `claimMessage`. 
- `PolygonRollupManager.sol`: Rollup Manager contract on L1, all L2 contracts settle on L1 and update their LET via Rollup Manager on L1. Then Rollup Manager updates the RET on L1.
- `PolygonZkEVMGlobalExitRootV2.sol`: Global Exit Root contract on L1, its root is updated every time when a new Rollup Exit Root or Mainnet Exit Root is updated.
- `PolygonZkEVMGlobalExitRootL2.sol`: Global Exit Root contract on L2s, its root is fetched and updated by L2 to sync with the latest GER on L1.
- and others.

### Bridge Service

- **[Chain Indexer Framework](https://docs.polygon.technology/tools/chain-indexer-framework/overview/#2-why-do-dapps-need-a-blockchain-data-indexer)**: An EVM blockchain data indexer. It parses, sorts, and organizes blockchain data for the Bridge Service API. Each chain connected to AggLayer will have its own indexer instance.

- **Transaction API**: All details of a bridge transaction initiated by or incoming to a user’s walletAddress. Details include the real time status, the token bridged, the amount, the source and destination chain etc. Used for the user interface to display the status of the transaction. 

    - API endpoints are: 
    
        - Testnet: `https://api-gateway.polygon.technology/api/v3/transactions/testnet?userAddress={userAddress}`
        
        - Mainnet: `https://api-gateway.polygon.technology/api/v3/transactions/mainnet?userAddress={userAddress}`

    - `userAddress` should be the address that is associated with the cross-chain transaction.

    - Attach API Key in the header! (Check below example to learn more)

    - An example Transaction API can be seen as follows:
      ```bash
      curl --location 'https://api-gateway.polygon.technology/api/v3/transactions/mainnet?userAddress={userAddress}' \
      --header 'x-api-key: <your-api-key-here>'
      ```
      > API Key: **Transaction API** & **Proof Generation API** requires API Key to access. Please Check this [guide](https://polygontechnology.notion.site/api-gateway-service-documentation) on how to generate one.


- **Proof Generation API**: The merkle proof payload needed to process claims on the destination chain. 

    - API endpoint are:
    
        - Testnet: `https://api-gateway.polygon.technology/api/v3/proof/testnet/merkle-proof?networkId={sourceNetworkId}&depositCount={depositCount}`
        - Mainnet: `https://api-gateway.polygon.technology/api/v3/proof/mainnet/merkle-proof?networkId={sourceNetworkId}&depositCount={depositCount}`
    
    - `networkId` is the network ID registered on AggLayer, `0` for Ethereum/Sepolia, and `1` for Polygon zkEVM/Cardona, and more.
    
    - `depositCount` is the leaf index of the Local Exit Tree from the source chain(Explained in the next section). You can get the depositCount by checking the `bridgeAsset`/`bridgeMessage` event logs or use the Transaction API above to get the depositCount.

    - Remember to attach API Key in header!

### Tools

- **Claimer**: Anyone who wants to help finish the bridging process can become the claimer. Claim Service can be deployed by dapps, chains, or anyone. There's also an [auto claiming script](https://github.com/0xPolygon/auto-claim-service) available, which automates the claim process on the destination chain.
- **[Lxly.js](https://github.com/0xpolygon/lxly.js?tab=readme-ov-file)**: LxLy.js is a javascript library which has all the prebuilt functions for interacting with the lxly bridge contracts. It does most of the heavy lifting, like type conversion, formatting, error handling etc. It makes it very easy for a developer to invoke the bridge, claim and many other functions required for bridging.

![Unified Bridge](./pics/UnifiedBridgeDiagram.png)

## 4. Bridging Interface in Unified Bridge

There are two types of bridging transactions on Unified Bridge.

- Assets: `bridgeAsset` & `claimAsset` are used for bridging tokens from one chain to another.
- Message: `bridgeMessage` & `claimMessage` are used for bridging messages from one chain to another

### Assets Bridging

**`BridgeAsset` code can be found [here](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMBridgeV2.sol#L204), the interface looks as follows:** 

```solidity
/**
* @notice Deposit add a new leaf to the merkle tree
* note If this function is called with a reentrant token, it would be possible to `claimTokens` in the same call
* Reducing the supply of tokens on this contract, and actually locking tokens in the contract.
* Therefore we recommend to third parties bridges that if they do implement reentrant call of `beforeTransfer` of some reentrant tokens
* do not call any external address in that case
* note User/UI must be aware of the existing/available networks when choosing the destination network
* @param destinationNetwork Network destination
* @param destinationAddress Address destination
* @param amount Amount of tokens
* @param token Token address, 0 address is reserved for ether
* @param forceUpdateGlobalExitRoot Indicates if the new global exit root is updated or not
* @param permitData Raw data of the call `permit` of the token
*/
function bridgeAsset(
    uint32 destinationNetwork,
    address destinationAddress,
    uint256 amount,
    address token,
    bool forceUpdateGlobalExitRoot,
    bytes calldata permitData
)
```

The code go through a few steps to complete the bridging process:
1. Check the `destinationNetwork` is not set as the source network's ID.
2. Prepare tokens to be bridged, there are different ways to prepare the tokens to be bridged, depending on the token type:

| Token type | Action |
| --- | --- |
| Native Gas Token, including ETH and Custom Gas Token | The bridge contract holds the tokens. |
| WETH | Burn the `WETH` tokens from user's address. |
| Foreign ERC20 Token | If the token contract is not originally from the source network, burn the ERC20 token from user's address. |
| Native ERC20 Token | If the token contract is originally from the source network, run the `permitData` if provided, then transfer the ERC20 token from user's address to the bridge contract. |

> Note that in case `ETH` is the native token, WETHToken will be at `0x0` address.

3. Emit the `BridgeEvent`
4. Add the `bridgeAsset` data to the `Local Exit Tree` as a leaf node

**`claimAsset` code can be found [here](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMBridgeV2.sol#L446), the interface looks as follows:**

```solidity
/**
* @notice Verify merkle proof and withdraw tokens/ether
* @param smtProofLocalExitRoot Smt proof to proof the leaf against the network exit root
* @param smtProofRollupExitRoot Smt proof to proof the rollupLocalExitRoot against the rollups exit root
* @param globalIndex Global index is defined as:
* | 191 bits |    1 bit     |   32 bits   |     32 bits    |
* |    0     |  mainnetFlag | rollupIndex | localRootIndex |
* note that only the rollup index will be used only in case the mainnet flag is 0
* note that global index do not assert the unused bits to 0.
* This means that when synching the events, the globalIndex must be decoded the same way that in the Smart contract
* to avoid possible synch attacks
* @param mainnetExitRoot Mainnet exit root
* @param rollupExitRoot Rollup exit root
* @param originNetwork Origin network
* @param originTokenAddress  Origin token address, 0 address is reserved for ether
* @param destinationNetwork Network destination
* @param destinationAddress Address destination
* @param amount Amount of tokens
* @param metadata Abi encoded metadata if any, empty otherwise
*/
function claimAsset(
    bytes32[_DEPOSIT_CONTRACT_TREE_DEPTH] calldata smtProofLocalExitRoot,
    bytes32[_DEPOSIT_CONTRACT_TREE_DEPTH] calldata smtProofRollupExitRoot,
    uint256 globalIndex,
    bytes32 mainnetExitRoot,
    bytes32 rollupExitRoot,
    uint32 originNetwork,
    address originTokenAddress,
    uint32 destinationNetwork,
    address destinationAddress,
    uint256 amount,
    bytes calldata metadata
)
```

Before the `claimAsset` function is initiated, all these inputs have to be prepared:

- Both `smtProofLocalExitRoot` and `smtProofRollupExitRoot` can be fetched via the **Proof Generation API**, the `depositCount` param for the Proof API is located at the fetch result of **Transaction API**, is your bridge transaction's `counter` field in the response.
- `GlobalIndex` can be constructed as described in **Global Exit Root, L1 Info Tree, Global Index**
- The rest can be found via **Transaction API**.

Then the code will go through a few steps to complete the claiming process:

1. Check the `destinationNetwork` is in fact the current network.
2. Verifies the SMT Proofs.
   1. Construct the new `globalExitRoot` using `mainnetExitRoot` and `rollupExitRoot` and compare with the L2 chain's recorded updated `globalExitRoot`. If they are different then revert.
   2. According to `Global Index` to check if source chain is L1 or L2
      - if L1 then verify `smtProofLocalExitRoot` with `mainnetExitRoot`
      - if L2 then verify the L2 leaf node with `smtProofLocalExitRoot`, `smtProofRollupExitRoot`, and `rollupExitRoot`
   3. Record that its claimed on the destination network.
3. Once the proof passes, claim the tokens in different ways depending on the token type:

| Token type | Action |
| --- | --- |
| ETH is gas token | Bridge contract will transfer the amount from itself to the destination address. |
| WETH where ETH is not gas token | Mint new WETH to the destination address. |
| Custom gas token | Bridge contract will transfer the amount from itself to the destination address. |
| Native ERC20 Token | If the token contract is originally from this destination network, the transfer the ERC20 token from bridge contract to destination address. |
| Foreign ERC20 Token, First time bridging | Deploy a new ERC20 Token contract to host this new Foreign ERC20 Token. and mint the transfer amount to destination address. |
| Foreign ERC20 Token, Contract exist | Mint the transfer amount to destination address. |

4. Emit the `ClaimEvent`

### Message Bridging

**`BridgeMessage` & `BridgeMessageWETH` code can be found [here](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMBridgeV2.sol#L325), the interface looks as follows:** 

```solidity
/**
* @notice Bridge message and send ETH value
* note User/UI must be aware of the existing/available networks when choosing the destination network
* @param destinationNetwork Network destination
* @param destinationAddress Address destination
* @param forceUpdateGlobalExitRoot Indicates if the new global exit root is updated or not
* @param metadata Message metadata
*/
function bridgeMessage(
    uint32 destinationNetwork,
    address destinationAddress,
    bool forceUpdateGlobalExitRoot,
    bytes calldata metadata
) payable

/**
* @notice Bridge message and send ETH value
* note User/UI must be aware of the existing/available networks when choosing the destination network
* @param destinationNetwork Network destination
* @param destinationAddress Address destination
* @param amountWETH Amount of WETH tokens
* @param forceUpdateGlobalExitRoot Indicates if the new global exit root is updated or not
* @param metadata Message metadata
*/
function bridgeMessageWETH(
    uint32 destinationNetwork,
    address destinationAddress,
    uint256 amountWETH,
    bool forceUpdateGlobalExitRoot,
    bytes calldata metadata
)
```

The code go through a few steps to complete the bridging process:

1. Check value condition:
   - [For `BridgeMessage`], if the custom gas token exist in the source chain, if exist, then this function should only callable without value, value should only be transferable via this function if the native gas token is `ETH`
   - [For `BridgeMessageWETH`], only allowed to use if `ETH` is not the gas token of the chain.
2. Check the `destinationNetwork` is not set as the source network's ID.
3. Emit the `BridgeEvent`
4. Add the `bridgeMessage` / `bridgeMessageWETH`  data to the `Local Exit Tree` as a leaf node.

**`ClaimMessage` code can be found [here](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMBridgeV2.sol#L599), the interface looks as follows:** 

```solidity
/**
* @notice Verify merkle proof and execute message
* If the receiving address is an EOA, the call will result as a success
* Which means that the amount of ether will be transferred correctly, but the message
* will not trigger any execution
* @param smtProofLocalExitRoot Smt proof to proof the leaf against the exit root
* @param smtProofRollupExitRoot Smt proof to proof the rollupLocalExitRoot against the rollups exit root
* @param globalIndex Global index is defined as:
* | 191 bits |    1 bit     |   32 bits   |     32 bits    |
* |    0     |  mainnetFlag | rollupIndex | localRootIndex |
* note that only the rollup index will be used only in case the mainnet flag is 0
* note that global index do not assert the unused bits to 0.
* This means that when synching the events, the globalIndex must be decoded the same way that in the Smart contract
* to avoid possible synch attacks
* @param mainnetExitRoot Mainnet exit root
* @param rollupExitRoot Rollup exit root
* @param originNetwork Origin network
* @param originAddress Origin address
* @param destinationNetwork Network destination
* @param destinationAddress Address destination
* @param amount message value
* @param metadata Abi encoded metadata if any, empty otherwise
*/
function claimMessage(
    bytes32[_DEPOSIT_CONTRACT_TREE_DEPTH] calldata smtProofLocalExitRoot,
    bytes32[_DEPOSIT_CONTRACT_TREE_DEPTH] calldata smtProofRollupExitRoot,
    uint256 globalIndex,
    bytes32 mainnetExitRoot,
    bytes32 rollupExitRoot,
    uint32 originNetwork,
    address originAddress,
    uint32 destinationNetwork,
    address destinationAddress,
    uint256 amount,
    bytes calldata metadata
)
```

The data preparation steps are the same as `claimAsset`, the code will go through a few steps to complete the claiming process:

1. Check the `destinationNetwork` is in fact the current network.
2. Verifies the SMT Proofs.
   1. Construct the new `globalExitRoot` using `mainnetExitRoot` and `rollupExitRoot` and compare with the L2 chain's recorded updated `globalExitRoot`. If they are different then revert.
   2. According to `Global Index` to check if source chain is L1 or L2:
      - if L1 then verify `smtProofLocalExitRoot` with `mainnetExitRoot`
      - if L2 then verify the L2 leaf node with `smtProofLocalExitRoot`, `smtProofRollupExitRoot`, and `rollupExitRoot`
   3. Record that its claimed on the destination network.
3. Once the proof passes, execute the message, (please note message can only be executed if the `destinationAddress` is a smart contract that inherited the [`IBridgeMessageReceiver.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/interfaces/IBridgeMessageReceiver.sol) interface).
   - if the native gas token is `ETH`, then transfer `ETH` to the `destinationAddress` and execute the message.
   - if `ETH` is not the native gas token, then mint `WETH` to the `destinationAddress` and exeute the message.
4. Emit the `ClaimEvent`.


## 5. Bridge-and-Call

Bridge-and-Call is a feature in Unified Bridge that allows developers to initiate a cross-chain transaction call on the destination chain from the source chain.

It is different from **Bridge Message**, where Bridge Message requires the destination address to be a smart contract that implemented the `IBridgeMessageREceiver.sol` interface. Whereas for **Bridge-and-Call**, it itself is the contract that has implemented the interface, and it will be able to execute any functions on any smart contract in the destination network.

### Bridge-and-Call Components

Consist of multiple interface, helper contracts, as well as the extension contract, some of the important ones are:

- [`BridgeExtension.sol`](https://github.com/agglayer/lxly-bridge-and-call/blob/755088953ddd2f586a2009ae34a33ae12e60f0eb/src/BridgeExtension.sol): Bridge Extension contract on both L1 and L2, that access the `PolygonZKEVMBridgeV2.sol` contract. 
- [`JumpPoint.sol`](https://github.com/agglayer/lxly-bridge-and-call/blob/755088953ddd2f586a2009ae34a33ae12e60f0eb/src/JumpPoint.sol): Process the Destination Chain asset transfer as well as the contract call.

![Unified Bridge](./pics/UnifiedBridgeDiagram_BandC.png)

## 6. Bridging Interface in Bridge-and-Call

### BridgeExtention.sol

**`bridgeAndCall` code can be found [here](https://github.com/agglayer/lxly-bridge-and-call/blob/755088953ddd2f586a2009ae34a33ae12e60f0eb/src/BridgeExtension.sol#L29), the interface looks as follows:** 

```solidity
/**
* @notice Bridge and Call from source chain to destination chain
* @param token Token to send to destination chain
* @param amount Amount of token to send to destination Chain
* @param callAddress The smart contract address to call at the destination network from destination
* BridgeExtension contract.
* @param fallbackAddress If the JumpPoint Execution fails on callAddress, the assets will be transferred to the fallbackAddress on destination network
* @param callData Abi encoded callData if any, empty otherwise
* @param forceUpdateGlobalExitRoot Indicates if the new global exit root is updated or not
*/
function bridgeAndCall(
    address token,
    uint256 amount,
    uint32 destinationNetwork,
    address callAddress,
    address fallbackAddress,
    bytes calldata callData,
    bool forceUpdateGlobalExitRoot
) external payable
```

the code will go through a few steps to complete the bridging process:

1. Preparing Bridging Tokens:
   - When the source chain's gas token is not `ETH`, then send `WETH` from sender address to the bridge extension contract
   - When transfering gas token, gas token already transferred to the extension contract
   - When transfering any ERC-20 tokens, send the token from sender address to the bridge extension contract
2. Compute JumpPoint address on destination network and call `bridgeAssets`
3. Check if `bridgeAsset` was successful, if successful then next step.
4. Encode message to bridge and call `bridgeMessage`

**`onMessageReceived` code can be found [here](https://github.com/agglayer/lxly-bridge-and-call/blob/755088953ddd2f586a2009ae34a33ae12e60f0eb/src/BridgeExtension.sol#L218), the interface looks as follows:** 

```solidity
/**
* @notice interface for PolygonZkEVM Bridge message receiver
* @param originAddress Message origin sender address. (BridgeExtension Address on source chain)
* @param originNetwork Message origin network. (Source chain network id)
* @param data Abi encoded callData. 
*/
function onMessageReceived(
	address originAddress, 
	uint32 originNetwork, 
	bytes calldata data
) external payable
```

Note that this function is called when calling `claimMessage` on destination network, it's only callable by the Bridge Contract.

1. Access control, making sure its Bridge Contract Calling, and the message origin on the source chain is also bridge contract.

2. Decode `data` into 

   ```solidity
   uint256 dependsOnIndex,
   address callAddress,
   address fallbackAddress,
   uint32 assetOriginalNetwork,
   address assetOriginalAddress,
   bytes memory callData
   ```

3. Check if the Bridge Message is claimed or no

4. Instantiate a new JumpPoint smart contract and execute the asset that was transferred from Bridge Contract to JumpPoint smart contract, transfer them to final `callAddress` contract and execute `callData`.

### JumpPoint.sol

```solidity
constructor(
    address bridge,
    uint32 assetOriginalNetwork,
    address assetOriginalAddress,
    address callAddress,
    address fallbackAddress,
    bytes memory callData
) payable
```

The assets transferred from source chain via `bridgeAsset` should have already transferred to this new JumpPoint Smart contract on destination network.

1. Once instantiated, first thing is to check the asset that was transferred to this JumpPoint Smart Contract, whether is a `ETH` token, `WETH` token, Custom Gas Token, or ERC-20 token.
2. Depending on the token type, transfer the token accordingly to the final `callAddress`, and then do the smart contract call with `callData`
3. If the execution fails on the `callAddress` contract, tokens are transferred to `fallbackAddress`.

## 7. Security of Unified Bridge
- **Secured by Ethereum**: Settlement on Ethereum
  
  All cross-chain transactions are settled on Ethereum before they can be claimed on the destination chain. This ensures that asset transfers originating from the source chain are valid and secure.

- **Secured by Mathematics**: Merkle Proof Validation
  
  Once the source chain bridging transaction is finalized on Ethereum, the destination chain verifies the proof to confirm that the assets transferred from the source chain are indeed settled on Ethereum.

- **Secured by Design**: Immutable Data Packaging 

  During an asset transfer from the source chain, the transaction requires the caller to specify the destination chain, the destination address, and the amount of assets to be transferred. These details are bundled together in an immutable cross-chain transaction.

  When claiming the assets on the destination chain, the smart contract verifies the correct destination network and processes the claim using the pre-defined destination address and asset amount. This design ensures:
  - Assets cannot be claimed on an incorrect network.
  - Assets cannot be claimed to an incorrect address.
  - Assets cannot be claimed in excess of the transferred amount.

  The claim process is open to anyone, as the outcome is predetermined regardless of who initiates the claim. Claimers simply pay the gas fee to facilitate the completion of the cross-chain transaction.

- **Secured by Access Control**: No Administrative Privileges
  
  The bridge contract can only mint, burn, or transfer assets through user-initiated bridge transactions. There is no administrative control over assets locked in the bridge contract. Only users with a balance of the specific tokens have access to their respective assets.

To learn more about the actions for different types of tokens(gas token, Eth token, ERC-20 Token, etc), please check out the above [specs](#assets-bridging)

In conclusion, because of the nature of Unified Bridge's design, there will be tokens locked and showing massive balances of all kinds of tokens in the bridge contract. All these tokens are secured by Ethereum, Mathematics, Safe design, as well as access control, and can only be transferred/mint/burn that matches the [specs](#assets-bridging).

The architecture ensures secure cross-chain communication while maintaining the integrity of the token supply on every chain connected on agglayer through multiple layers of cryptographic verification and mathematical constraints.

# Using it as a Developer

> For more `lxly.js` examples, please refer to the [examples](https://github.com/0xPolygon/lxly.js/tree/main/examples/lxly) folder.

## L1 -> L2 using `BridgeAsset` interface in `Lxly.js`:

### Flow for L1 -> L2 Bridging Transactions

1. User/Developer/Dapp initiate `bridgeAsset` call on L1
2. Bridge contract on L1 appends an exit leaf to mainnet exit tree of the L1, and update its mainnet exit root.
3. Global exit root manager appends the new L1 mainnet exit root to global exit tree and computes the new global exit root.
4. L2 sequencer fetches and updates the latest global exit root from the global exit root manager.
5. User/Developer/Dapp/Chain initiates `claimAsset` call, and also provides the smtProof.
6. Bridge contract on destination L2 chain validates the smtProof against the global exit root on its chain. If passes next step.
7. Transfer/Mint the asset to the destination address.

![Bridge Asset L1 to L2](./pics/BridgeAssetProcess.png)

### Code Walkthrough

We will be using `lxly.js` to initiate the `bridgeAsset` call and `claimAsset` call.

1. Check your Balance: `node scripts/src/balance.js`

```javascript
const { getLxLyClient, tokens, configuration, from } = require('./utils/utils_lxly');

const execute = async () => {
  // instantiate a lxlyclient
  const client = await getLxLyClient();
  // Sepolia NetworkId is 0, Cardona NetworkId is 1
  const networkId = 0;
  // get an api instance of ether token on sepolia testnet
  const erc20Token = client.erc20(tokens[networkId].ether, networkId);
  // check balance
  const result = await erc20Token.getBalance(from);
  console.log("result", result);
}

execute().then(() => {
}).catch(err => {
  console.error("err", err);
}).finally(_ => {
  process.exit(0);
});
```

2. Bridge Eth from sepolia to Cardona: `node scripts/src/bridge_asset.js`

```javascript
const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    // instantiate a lxlyclient
    const client = await getLxLyClient();
    // source NetworkId is 0, since its Sepolia
    const sourceNetworkId = 0;
    // get an api instance of ether token on sepolia testnet
    const token = client.erc20(tokens[sourceNetworkId].ether, sourceNetworkId);
    // Set Destination Network as Cardona
    const destinationNetworkId = 1;
    // call the `bridgeAsset` api. Bridging 1 eth
    const result = await token.bridgeAsset("1000000000000000000", to, destinationNetworkId);
  	// getting the transactionhash if rpc request is sent
    const txHash = await result.getTransactionHash();
    console.log("txHash", txHash);
  	// getting the transaction receipt.
    const receipt = await result.getReceipt();
    console.log("receipt", receipt);
}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
```

3. Claim Assets after GlobalExitRootManager is synced from source to destination. Since Cardona currently has a autoclaiming bot running, you don't need to do claim asset call. But in case you want to know how to do it, here's the code at `scripts/src/claim_asset.js`:

```javascript
const { getLxLyClient, tokens, configuration, from } = require('./utils/utils_lxly');

const execute = async () => {
  	// the source chain txn hash of `bridgeAsset` call.
    const bridgeTransactionHash = "";
		
    // instantiate a lxlyclient
  	const client = await getLxLyClient();
    // the source networkId
    const sourcenNetworkId = 0;
    // the destination networkId
    const destinationNetworkId = 1;
    // get an api instance of ether token on cardona testnet
    const token = client.erc20(tokens[destinationNetworkId].ether, destinationNetworkId);
	  // call the `claimAsset` api.
    const result = await token.claimAsset(bridgeTransactionHash, sourcenNetworkId, {returnTransaction: false});
    console.log("result", result);
  	// getting the transactionhash if rpc request is sent
    const txHash = await result.getTransactionHash();
    console.log("txHash", txHash);
  	// getting the transaction receipt.
    const receipt = await result.getReceipt();
    console.log("receipt", receipt);

}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});
```

4. After about 20 mins, your balance of `ETH` on destination chain should have increased to the transfered amount! You can check using the `balance.js` script, but remember to change the network id!

## L2 -> L1 using `BridgeMessage` interface in `Lxly.js`: 

### Flow for L2 -> L1 Bridging Transactions

1. User/Developer/Dapp initiate `bridgeMessage` call on L2
2. Bridge contract on L2 appends an exit leaf to local exit tree of the L2, and update its local exit root on L2.
3. Sends the new local exit root to L1 to verify, once passed the L2's local exit root, aka the leaf node in the rollup exit tree will be updated, which will cause a chain of updates to Global exit root updates on L1 and also L1InfoTree updates.
4. User/Developer/Dapp/Chain initiates `claimMessage` call, and also provides the smtProof.
5. Bridge contract on destination L1 chain validates the smtProof against the global exit root on its chain. If passes next step.
6. Execute `onMessageReceived` process.

![Bridge Message L2 to L1](./pics/BridgeMessageProcess.png)

### Code Walkthrough

The `lxly.js` will be used to initiate the `bridgeMessage` call and `claimMessage` call.

1. Deploy a `onMessageReceived` function implemented smart contract `counter.sol` on destination network, in this example, it will be on Sepolia.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract counter {
    uint256 public count;

    constructor() {
        count = 0;
    }

    function increment(uint256 amount) public {
        count = count + amount;
    }

    // Function to handle the received message
    // this is the interface that `claimMessage` will be able to access with.
    function onMessageReceived(
        address originAddress, 
        uint32 originNetwork, 
        bytes calldata metadata
    ) external payable {
        uint256 amount = abi.decode(metadata, (uint256));
        require(amount > 0, "Has to increment at least 1");
        require(amount < 5, "Has to increment less than 5");
        // its also better to check if the msg.sender is the bridge address
        // for this demo we will assume it always will be

        increment(amount);
    }
}
```

2. Bridge Message from cardona to sepolia: `node scripts/src/bridge_message.js`

```javascript
const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');
const { Bridge } = require('@maticnetwork/lxlyjs');
const { encodePacked } = require('viem');

// Encode the amount into a uint256.
function encodeMetadata(amount) {
    return encodePacked(["uint256"], [amount]);
}

const execute = async () => {
    const client = await getLxLyClient();
    // change this with your smart contract deployed on destination network.
    const destinationAddress = "0x43854F7B2a37fA13182BBEA76E50FC8e3D298CF1"; 
    // the destination Network ID for this example is spolia, therefore is 0.
    const sourceNetworkId = 1;
    // Call bridgeMessage function.
    const destinationNetworkId = 0; 
    // the source Network ID for this example is Cardona, therefore is 1.
    const result = await client.bridges[sourceNetworkId]
        .bridgeMessage(destinationNetworkId, destinationAddress, true, encodeMetadata(3));
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

```

3. Claim Message after GlobalExitRootManager is synced on L1.  `scripts/src/claim_message.js`:

```javascript
const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();
    // bridge txn hash from the source chain.
    const bridgeTransactionHash = "0xfe25c1d884a7044ba18f6cee886a09a8e94f9ae12c08fd5d94cdc6f430376bf2"; 
    // Network should be set as 1 since its from cardona.
    const sourceNetworkId = 1;
    // Network should be set as 0 since its to sepolia
    const destinationNetworkId = 0;
    // API for building payload for claim
    const result = 
        await client.bridgeUtil.buildPayloadForClaim(bridgeTransactionHash, sourceNetworkId)
        // payload is then passed to `claimMessage` API
        .then((payload) => {
            console.log("payload", payload);
            return client.bridges[destinationNetworkId].claimMessage(
                payload.smtProof,
                payload.smtProofRollup,
                BigInt(payload.globalIndex),
                payload.mainnetExitRoot,
                payload.rollupExitRoot,
                payload.originNetwork,
                payload.originTokenAddress,
                payload.destinationNetwork,
                payload.destinationAddress,
                payload.amount,
                payload.metadata
            );
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
```


## L2 -> L2 using `Bridge-and-Call` in Lxly.js:

### Flow for L2 -> L2 Bridging Transactions

1. User/Developer/Dapp initiate `bridgeAndCall` call on L2 Source.
2. Similar to L2 -> L1 process, global exit root on L1 is updated, which includes the source chain bridging transaction.
3. Then destination L2 sequencer fetches and updates the latest global exit root from the global exit root manager.
4. Bridge contract on destination L2 chain validates the smtProof against the global exit root on its chain. If passes next step.
5. Process the `claimAsset`, `claimMessage` on destination L2 chain.

![Bridge and Call L2 to L2](./pics/BridgeAndCallProcess.png)

### Code Walkthrough

TheWe will be using lxly.js will be used to initiate the `bridgeAndCall` call and `claimMessage` call.

1. Deploy the same `counter.sol` contract on `silicon sepolia` testnet.
2. Call `bridgeAndCall` from cardona to silicon sepolia: `node scripts/src/bridge_and_call.js`

```javascript
const { getLxLyClient, tokens, configuration, from } = require('./utils/utils_lxly');
const { CounterABI } = require("../../ABIs/Counter");

const execute = async () => {
    const client = await getLxLyClient();

    // set token as `eth`.
    const token = "0x0000000000000000000000000000000000000000";
    // not bridging any token this time
    const amount = "0x0";
    // because we are bridging from cardona.
    const sourceNetwork = 1; 
    // sending to silicon sepolia.
    const destinationNetwork = 16;
    // change it to the counter smart contract deployed on destination network.
    const callAddress = "0x43854F7B2a37fA13182BBEA76E50FC8e3D298CF1";
    // if transaction fails, then the funds will be sent back to user's address on destination network.
    const fallbackAddress = from;
    // if true, then the global exit root will be updated.
    const forceUpdateGlobalExitRoot = true;
    // get the call Contract ABI instance.
    const callContract = client.contract(CounterABI, callAddress, destinationNetwork);
    // prepare the call data for the counter smart contract on destination chain.
    const callData = await callContract.encodeAbi("increment", "0x4");  
    
    let result;
    // Call bridgeAndCall function.
    if (client.client.network === "testnet") {
        console.log("testnet");
        result = await client.bridgeExtensions[sourceNetwork].bridgeAndCall(
            token,
            amount,
            destinationNetwork,
            callAddress,
            fallbackAddress,
            callData,
            forceUpdateGlobalExitRoot,
            permitData="0x0", // permitData is optional
        )
    } else {
        console.log("mainnet");
        result = await client.bridgeExtensions[sourceNetwork].bridgeAndCall(
            token,
            amount,
            destinationNetwork,
            callAddress,
            fallbackAddress,
            callData,
            forceUpdateGlobalExitRoot,
        )
    }

    console.log("result", result);
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
```

3. Claim Asset & Claim Message after GlobalExitRootManager is synced on silicon sepolia.  
```bash
node scripts/src/claim_asset.js
node scripts/src/claim_message.js
```
Remember to update `bridgeTransactionHash`, `sourceNetworkId`, and `destinationNetworkId` before running the scripts.

# FAQ

<details>
  <summary><b>Can I deploy my own tokens on destination chains instead of having Unified Bridge to help me deploy new token contracts on destination chain?</b></summary>
  
  It's possible in Sovereign L2s connected on Agglayer, when the help of bridge maintainer, you will be able to add your own tokens to the Unified Bridge Mapping via [this](https://github.com/0xPolygonHermez/zkevm-contracts/blob/feature/sovereign-bridge/contracts/v2/sovereignChains/BridgeL2SovereignChain.sol#L212) function.
</details>

<details>
  <summary><b>What's the difference between `NetworkID` and `ChainID`? How to get the `NetworkID`? </b></summary>

  `NetworkID` is a chain indexes that Agglayer maintains, where each chain connects on Agglayer will have its own NetworkID in the scope of Agglayer. It is not ChainID which works universally, NetworkID is only for Agglayer.
  
  If you want to know the `chainid` to `networkid` mapping checkout this info (Need to go to "contract" tap, and click on "Read as Proxy"):
  - On "Ethereum Mainnet", you can query using this interface: [chainIDToRollupID](https://etherscan.io/address/0x5132A183E9F3CB7C848b0AAC5Ae0c4f0491B7aB2#readProxyContract)
  - On "Sepolia Testnet", the contract is this [one](https://sepolia.etherscan.io/address/0x32d33D5137a7cFFb54c5Bf8371172bcEc5f310ff#readProxyContract)
  - If you want to get from `rollupid` to `chainid`, you can use: [rollupIDtoRollupData](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonRollupManager.sol#L179) which then will return the RollupData struct that has [chainID](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonRollupManager.sol#L70) included.
</details>

# Reference

- https://docs.polygon.technology/zkEVM/architecture/unified-LxLy/
- https://github.com/0xPolygonHermez/zkevm-contracts/tree/main
- https://github.com/agglayer/ulxly-contracts/tree/develop
- https://github.com/agglayer/lxly-bridge-and-call
- https://github.com/0xPolygon/lxly.js
- https://github.com/agglayer/lxly-bridge-and-call-demos
- https://github.com/0xrouss/agglayer-scripts
- https://mirror.xyz/0x88CDEA0b273Dd4C89A51032B69Ccfe6F3FfA495a/VV_f29igjzF8Wkhl3Mbkcj-UYrYLhnnjb2iWJ54JpA4
