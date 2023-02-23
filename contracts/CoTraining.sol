// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CoTraining {
    struct Task {
        uint256 id;
        address owner;
    }

    using Counters for Counters.Counter;
    Counters.Counter private taskId;

    mapping (uint256 => Task) private idToTasks;
    mapping (address => uint) tokenLocked;

    ERC20 private ctt;

    constructor(ERC20 token) {
        ctt = token;
    }

    function deposit(uint256 amount) public {
        bool success = ctt.approve(address(this), amount);
        require(success);
        success = ctt.transferFrom(msg.sender, address(this), amount);
        require(success);
        tokenLocked[msg.sender] += amount;
    }

    function withdraw(uint256 amount) public {
        require(tokenLocked[msg.sender] >= amount, "withdraw token amount must be less than tokenLocked");
        bool success = ctt.transfer(msg.sender, amount);
        require(success);
        tokenLocked[msg.sender] -= amount;
    }

    function balanceLocked(address owner) public view returns (uint256) {
        return tokenLocked[owner];
    }

    /**
     * publish the task
     * return taskId
     */
    function publishTask(uint256 taskGas) public returns (uint256) {
        require(tokenLocked[msg.sender] >= taskGas, "not enough gas token locked");
        tokenLocked[msg.sender] -= taskGas;

        uint256 id = taskId.current();
        // todo: judge existences
        // lock the money
        idToTasks[id] = Task(taskId.current(), msg.sender);
        taskId.increment();
        return id;
    }
}