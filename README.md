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
  - [4. Bridging Interface in Unified Bridge](#4-bridging-interface-in-unified-bridge)
    - [Assets Bridging](#assets-bridging)
    - [Message Bridging](#message-bridging)
  - [5. Bridge-and-Call](#5-bridge-and-call)
    - [Bridge-and-Call Components](#bridge-and-call-components)
  - [6. Bridging Interface in Bridge-and-Call](#6-bridging-interface-in-bridge-and-call)
    - [BridgeExtention.sol](#bridgeextentionsol)
    - [JumpPoint.sol](#jumppointsol)
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
- [Future TODO](#future-todo)
- [Reference](#reference)


# Architecture of the Unified Bridge

## 0. Background

### L2s and Fragmentation 
As more L2 solutions emerge, a key challenge is ecosystem fragmentation. Fragmentation occurs when various L2s operate in silos, each with its own transaction processing, user base, and protocols. This creates several issues:

1. **Liquidity Fragmentation**: Liquidity is spread across multiple L2s, making it challenging to access a unified pool of assets for trading or lending. Users on one L2 cannot easily interact with assets on another, which reduces overall liquidity effectiveness.
2. **User Experience (UX) Issues**: Users must bridge assets across multiple L2s and adapt to different wallets, transaction formats, and fee structures, leading to a fragmented user experience. This can discourage adoption and reduce ease of access.
3. **Developer Complexity**: Developers must often build custom solutions for each L2, which increases development costs and creates inconsistent experiences across L2s. Standardization is difficult, and ensuring cross-L2 compatibility can be resource-intensive.
4. **Security Risks**: Fragmented systems increase potential attack vectors, as users rely on multiple bridges, sequencers, and contracts. Any vulnerability in one L2 can potentially affect assets and users across the ecosystem.
5. **Coordination Challenges**: Governance and decision-making across different L2s can be disjointed, making it hard to create a unified approach to updates, standards, or improvements. This could hinder the collective growth of the ecosystem.

### What is AggLayer

The AggLayer serves as an interoperability layer for cross-chain interactions among the chains connected to it. The AggLayer provides trustless messaging and liquidity sharing across connected chains, making it a more specialized solution than general-purpose protocols like Wormhole, Axelar, or LayerZero. However, it is not just a bridge; it's designed to handle native asset transfers and cross-chain execution, providing high security and low latency for connected chains. 

## 1. Introduction to Unified Bridge

The Unified Bridge (Prev. LxLy bridge) is an interoperability solution aimed at enabling cross-chain communication among AggLayer connected Networks. It enables the interaction between different networks such as L2 to L2, L1 to L2, and L2 to L1.

### Why do we need Unified Bridge

Unified Bridge is needed to enable cross-chain communication among different networks to solve the problem of fragmentation as well as to initiate one-step cross-chain transactions for seamless UX.

For **AggLayer**, it is a critical component to facilitate unified experience among the chains that are connected to AggLayer. In the process of cross-chain communication, Unified Bridge is the interface for developers, users to initiate the cross-chain transactions, then AggLayer will monitor and validate the validity of the cross-chain message via Pessimistic Proof (We will talk about it in another tutorial), then once the validation passes, the cross-chain message will be accepted and ready to be claimed on the destination chain.

## 2. Data Structure in Unified Bridge

The entire data structure of Unified Bridge Looks like this, we will explain each part in detail.
![Unified Bridge Data Structure](./pics/UnifiedBridgeTree.png)

AggLayer is maintaining a giant merkle tree like this to record all the cross-chain transactions, verify the validity of all cross-chain transactions, making sure source chain transaction is 

### Local Exit Root & Local Index

All cross-chain transactions using the Unified Bridge are recorded in a Sparse Merkle Tree called Local Exit Tree. Each AggLayer connected chains maintains its own local exit tree. This is maintained in [`PolygonZKEVMBridgeV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMBridgeV2.sol) on each AggLayer connected L2 and L1.

- `Local Exit Root(LET)`: The root of the tree is called the local exit root. It is a binary tree and has the height of 32. The root is updated every time a new cross-chain transaction is initiated.

- `depositCount(Local Root Index)`: The index of the leaf node, per leaf node is a hash of cross-chain transaction such as `bridgeAsset`/`bridgeMessage`.

![LET](./pics/LET.png)

### Rollup Exit Root

`rollupExitRoot` is the merkle root of all L2s' Local Exit Root. All AggLayer connected L2s constantly updates its Local Exit Root in [`PolygonRollupManager.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonRollupManager.sol), which updates the Rollup Exit Sparse Merkle Tree's Root.

When there's new cross-chain transactions initiated on Source Chain, it is chain's responsibility to submit its LET to the `RollupManager` smart contract on L1. The frequency is up to the L2, whether they submit the new LET for every new cross-chain transaction immediately, or maybe accumulate a certain number of cross-chain transactions then submit the LET with numbers of cross-chain transactions included.

Once the RollupManager has updated its `rollupExitRoot`, it will then update the `rollupExitRoot` on it will then update the `mainnetExitRoot` on [`PolygonZkEVMGlobalExitRootV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMGlobalExitRootV2.sol) on L1.

![RER](./pics/RET.png)

### Mainnet Exit Root

`mainnetExitRoot` is the same thing as Local Exit Root, but it is maintained on L1, which tracks the Bridging activities of L1 to All AggLayer connected L2s. When Mainnet Exit Root is updated on `PolygonZKEVMBridgeV2.sol` contract on L1, it will then update the `mainnetExitRoot` on [`PolygonZkEVMGlobalExitRootV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMGlobalExitRootV2.sol) on L1.

![L1MET](./pics/L1MET.png)

### Global Exit Root, L1 Info Tree, Global Index:

`globalExitRoot` is the basically the hash of `rollupExitRoot` and `mainnetExitRoot`. Whenever there's new RER or MER submitted to [`PolygonZkEVMGlobalExitRootV2.sol`](https://github.com/0xPolygonHermez/zkevm-contracts/blob/main/contracts/v2/PolygonZkEVMGlobalExitRootV2.sol), it will append the new GER to the L1 Info Tree.

`L1InfoTree` is the Sparse Merkle Tree that maintains the GERs. It is a binary tree and has the height of 32. The root is updated every time a new GER is submitted.

`Global Index` to locate the unique leaf in the new global exit tree. It is used when creating and verifying the SMT proof. It is a 256-bit string composed of unused bits, mainnet flag, rollup index bits, and local root index bits. Starting from the most significant bit, consists of the following bits:
- **191 bits of unused bits**: These bits are unused, and can be filled with any value. The best option is to fill them with zeros because zeros are cheaper.
- **1 bit of mainnet flag**: This single bit serves as a flag indicating whether an exit pertains to a rollup (represented by 0) or the mainnet (indicated by 1).
- **32 bit of the rollup Index**: These bits indicate the specific rollup being pointed at, within the rollup exit tree. These bits are therefore only used whenever mainnet flag is 0.
- **32 bits of the local root index**: These bits indicate the specific index being pointed at, within each rollup’s local exit tree.

![L1InfoTree](./pics/L1InfoTree.png)

## 3. Unified Bridge Components

There are two main components of Unified Bridge, the on-chain contracts, and the off-chain services, let's go through them one by one.

### Unified Bridge Contracts

The core of the service that acts as the interface for developers, users to initiate the cross-chain transactions, and facilitate contract calls on destination chain if specified. Deployed on both source and destination chains.

Consists of important [contracts](https://github.com/0xPolygonHermez/zkevm-contracts/tree/main/contracts):
- `PolygonZKEVMBridgeV2.sol`: Bridge contract on both L1 and L2, maintains its own LET. It is the access point for ll cross-chain transactions, including `bridgeAsset`, `bridgeMessage`, `claimAsset`, and `claimMessage`. 
- `PolygonRollupManager.sol`: Rollup Manager contract on L1, all L2 contracts settles on L1 and updates their LET via Rollup Manager on L1. Then Rollup Manager updates the RET on L1.
- `PolygonZkEVMGlobalExitRootV2.sol`: Global Exit Root contract on L1 and L2, its root is updated every time when a new Rollup Exit Root or Mainnet Exit Root is updated.
- and others.

### Bridge Service
- **[Chain Indexer Framework](https://docs.polygon.technology/tools/chain-indexer-framework/overview/#2-why-do-dapps-need-a-blockchain-data-indexer)**: An EVM blockchain data indexer. It parses, sort, and organizes blockchain data for the Bridge Service API. Each chain connected to AggLayer will have its own indexer instance.

- **Transaction API**: All details of a bridge transaction initiated by or incoming to a user’s walletAddress. Details include the real time status, the token bridged, the amount, the source and destination chain etc. Used for the user interface to display the status of the transaction. 

    API endpoint is `https://bridge-api-testnet-dev.polygon.technology/transactions?userAddress={userAddress}`.
    - `userAddress` should be the address that is associated with the cross-chain transaction.

- **Proof Generation API**: The merkle proof payload needed to process claims on the destination chain. 

    API endpoint is `https://bridge-api-testnet-dev.polygon.technology/merkle-proof?networkId={networkId}&depositCount={Number}`
    - `networkId` is the network ID registered on AggLayer, `0` for Ethereum/Sepolia, and `1` for Polygon zkEVM/Cardona, and more.
    - `depositCount` is the leaf index of the Local Exit Tree from the source chain(Explained in the next section). You can get the depositCount by checking the `bridgeAsset`/`bridgeMessage` event logs or use the Transaction API above to get the depositCount.

- **Claimer**: Anyone who wants to help finish the bridging process can become the claimer. Claim Service can be deployed by dapps, chains, or anyone. There's also [auto claiming script](https://github.com/0xPolygon/auto-claim-service) available, which automates the claim process on the destination chain.

- **[Lxly.js](https://github.com/0xpolygon/lxly.js?tab=readme-ov-file)**: LxLy.js is javascript library which has all the prebuilt functions for interacting with the lxly bridge contracts. It does most of the heavy lifting, like type conversion, formatting, error handling etc. It makes it very easy for a developer to invoke the bridge, claim and many other functions required for bridging.

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

1. Emit the `BridgeEvent`
2. Add the `bridgeAsset` data to the `Local Exit Tree` as a leaf node

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

Before we initiate the `claimAsset` function, we have to prepare all these inputs:

- Both `smtProofLocalExitRoot` and `smtProofRollupExitRoot` can be fetched via the **Proof Generation API**
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

It is different from **Bridge Message**, where Bridge Message requires the destination address to be a smart contract that implemented the `IBridgeMessageREceiver.sol` interface. Where as for **Bridge-and-Call**, it itself is the contract that has implemented the interface, and it will be able to execute any functions on any smart contract in the destination network.

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

The assets transferred from source chain via `bridgeAsset` should have already transferred to this new jumpPoint Smart contract on destination network.

1. Once instantiated, first thing is to check the asset that was transferred to `this`, whether is a `ETH` token, `WETH` token, Custom Gas Token, or ERC-20 token.
2. Depending on the token type, transfer the token accordingly to the final `callAddress`, and then do the smart contract call with `callData`
3. If the execution fails on the `callAddress` contract, tokens are transferred to `fallbackAddress`.

# Using it as a Developer

## L1 -> L2 using `BridgeAsset` interface in `Lxly.js`:

### Flow for L1 -> L2 Bridging Transactions

1. User/Developer/Dapp initiate `bridgeAsset` call on L1
2. Bridge contract on L1 appends an exit leaf to mainnet exit tree of the L1, and update its mainnet exit root.
3. Global exit root manager appends the new L1 mainnet exit root to global exit tree and computes the new global exit root.
4. L2 sequencer fetches and update the latest global exit root from the global exit root manager.
5. User/Developer/Dapp/Chain initiates `claimAsset` call, and also provides the smtProof.
6. Bridge contract on destination L2 chain validates the smtProof against the global exit root on its chain. If passes next step.
7. Transfer/Mint the asset to the destination address.

### Code Walkthrough

We will be using `lxly.js` to initiate the `bridgeAsset` call and `claimAsset` call.

```javascript

```

You can test out the process via:

```bash

```


## L2 -> L1 using `BridgeMessage` interface in `Lxly.js`: 

### Flow for L2 -> L1 Bridging Transactions

1. User/Developer/Dapp initiate `bridgeMessage` call on L2
2. Bridge contract on L2 appends an exit leaf to local exit tree of the L2, and update its global exit root on L2.
3. Sends the new local exit root to L1 to verify, once passed the L2's local exit root, aka the leaf node in the rollup exit tree will be updated, which will cause a chain of updates to Global exit root updates on L1 and also L1InfoTree updates.
4. User/Developer/Dapp/Chain initiates `claimMessage` call, and also provides the smtProof.
5. Bridge contract on destination L1 chain validates the smtProof against the global exit root on its chain. If passes next step.
6. Execute `onMessageReceived` process.

### Code Walkthrough

We will be using `lxly.js` to initiate the `bridgeMessage` call and `claimMessage` call.

```javascript

```

You can test out the process via:

```bash

```


## L2 -> L2 using `Bridge-and-Call` in Lxly.js:

### Flow for L2 -> L2 Bridging Transactions

1. User/Developer/Dapp initiate `bridgeAndCall` call on L2 Source.
2. Similar to L2 -> L1 process, global exit root on L1 is updated, which includes the source chain bridging transaction.
3. Then destination L2 sequencer fetches and update the latest global exit root from the global exit root manager.
4. Bridge contract on destination L2 chain validates the smtProof against the global exit root on its chain. If passes next step.
5. Process the `claimAsset`, `claimMessage` on destination L2 chain.

### Code Walkthrough

We will be using `lxly.js` to initiate the `bridgeMessage` call and `claimMessage` call.

```javascript

```

You can test out the process via:

```bash

```

# Future TODO

- [ ] Asset Bridging
  - [ ] L1 -> L2(ETH as gas token) Transfer foreign ERC-20
  - [ ] L1 -> L2(ETH as gas token) Transfer native ERC-20
  - [ ] L1 -> L2(custom gas token) Transfer L2 custom gas token
  - [ ] L1 -> L2(custom gas token) Transfer WETH
  - [ ] L2(ETH as gas token) -> L1 Transfer foreign ERC-20
  - [ ] L2(ETH as gas token) -> L1 Transfer native ERC-20
  - [ ] L2(custom gas token) -> L1 Transfer L2 custom gas token
  - [ ] L2(custom gas token) -> L1 Transfer WETH
  - [ ] L2(custom gas token) -> L2(custom gas token) transfer WETH
  - [ ] L2(custom gas token) -> L2(custom gas token) transfer source chain gas token
  - [ ] L2(custom gas token) -> L2(custom gas token) transfer destination chain gas token
- [ ] Message Bridging
  - [ ] Custom `onMessageReceived` contract example.
- [ ] Bridge-and-Call Bridging
  - [ ] L1 -> L2 -> L1
  - [ ] Defi call example transaction

# Reference

- https://docs.polygon.technology/zkEVM/architecture/unified-LxLy/
- https://github.com/0xPolygonHermez/zkevm-contracts/tree/main
- https://github.com/agglayer/ulxly-contracts/tree/develop
- https://github.com/agglayer/lxly-bridge-and-call
- https://github.com/0xPolygon/lxly.js
- https://github.com/agglayer/lxly-bridge-and-call-demos
