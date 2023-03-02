// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ICoTraining {
     function deposit(uint256 amount) external;
     function withdraw(uint256 amount) external;

     function balanceLocked(address owner) external view returns (uint256);
     function balanceOf(address account) external view returns (uint256);
     
     function publishTask(uint256 id, uint256 bounty) external;
     function settle(uint256 id, bytes32 root) external;
     function claim(uint256 id, bytes32[] memory proof, uint256 bounty) external;
}