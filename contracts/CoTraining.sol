// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./ICoTraining.sol";

contract CoTraining is ICoTraining {
    ERC20 private ctt;
    address private owner;

    struct Task {
        uint256 id;
        address owner;
        uint256 bounty;
        bytes32 settleRoot;
    }

    mapping(uint256 => Task) private idToTask;
    mapping(address => uint) private balancesLocked; // locked tokens
    mapping(address => uint) private balances; // available tokens

    event PublishedTask(
        address indexed owner,
        uint256 indexed taskId,
        uint256 bounty
    );
    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event Claim(
        address indexed account,
        uint256 indexed taskId,
        uint256 amount
    );

    constructor(ERC20 token) {
        ctt = token;
        owner = msg.sender;
    }

    modifier onlyGovner() {
        require(msg.sender == owner);
        // todo
        _;
    }

    function deposit(uint256 amount) public {
        bool success = ctt.transferFrom(msg.sender, address(this), amount);
        require(success);
        balances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) public {
        require(
            balances[msg.sender] >= amount,
            "withdraw token amount must be less than tokenLocked"
        );
        bool success = ctt.transfer(msg.sender, amount);
        require(success);
        balances[msg.sender] -= amount;
        emit Withdraw(msg.sender, amount);
    }

    function balanceLocked(address account) public view returns (uint256) {
        return balancesLocked[account];
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    /**
     *
     * @param id task id
     * @param bounty task bounty
     */
    function publishTask(uint256 id, uint256 bounty) public {
        require(
            balances[msg.sender] >= bounty,
            "not enough bounty token locked"
        );
        balances[msg.sender] -= bounty;
        balancesLocked[msg.sender] += bounty;
        idToTask[id] = Task(id, msg.sender, bounty, bytes32(""));

        emit PublishedTask(msg.sender, id, bounty);
    }

    /**
     *
     * @param id the task id
     * @param root merkle proof of the bounties map (address => bountry)
     */
    function settle(uint256 id, bytes32 root) public onlyGovner {
        Task storage task = idToTask[id];
        require(task.id > 0, "task not exists");
        task.settleRoot = root;
        balancesLocked[task.owner] -= task.bounty;
    }

    /**
     *
     * @param id the task id
     * @param proof bounties proof of the task
     * @param bounty amount the msg.sender try to claim
     */
    function claim(uint256 id, bytes32[] memory proof, uint256 bounty) public {
        Task storage task = idToTask[id];
        require(task.id > 0, "task not exists"); // todo: fix it
        bytes32 root = task.settleRoot;
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(msg.sender, bounty)))
        );
        require(MerkleProof.verify(proof, root, leaf), "Invalid claim proof");

        bool success = ctt.transfer(msg.sender, bounty);
        require(success);
        emit Claim(msg.sender, id, bounty);
    }
}
