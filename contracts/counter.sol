// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract counter {
    uint256 public count;

    constructor() {
        count = 0;
    }

    function increment(uint256 amount) public {
        count = count + amount;
    }

    // Function to handle the received message, this is the interface that `claimMessage` will be able to access with.
    function onMessageReceived(address originAddress, uint32 originNetwork, bytes calldata metadata) external payable {
        uint256 amount = abi.decode(metadata, (uint256));
        require(amount > 0, "Has to increment at least 1");
        require(amount < 5, "Has to increment less than 5");

        increment(amount);
    }
}