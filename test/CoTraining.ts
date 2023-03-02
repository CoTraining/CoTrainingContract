import { expect } from "chai";
import { ethers } from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { CoTrainingToken } from "../typechain-types/contracts/CoTrainingToken.sol";
import { CoTraining } from "../typechain-types";

describe("CoTraining", function () {
  let token: CoTrainingToken;
  let coTrainingContract: CoTraining;
  let owner: SignerWithAddress;
  let worker1: SignerWithAddress;
  let worker2: SignerWithAddress;
  let merchant1: SignerWithAddress;
  let merchant2: SignerWithAddress;
  let settleTree: StandardMerkleTree<string[]>;

  const taskId = 100;

  async function deployBasicCoTraingFixture() {
    // Contracts are deployed using the first signer/account by default
    [owner, worker1, worker2, merchant1, merchant2] = await ethers.getSigners();

    const CoTrainingToken = await ethers.getContractFactory("CoTrainingToken");
    token = await CoTrainingToken.deploy();

    await token.deployed();

    const CoTraing = await ethers.getContractFactory("CoTraining");
    coTrainingContract = await CoTraing.deploy(token.address);
  }

  before(deployBasicCoTraingFixture);

  it("1. mint tokens for test accounts", async () => {
    await token.mint(owner.address, 100000);
    expect(await token.balanceOf(owner.address)).to.equal(100000);

    await token.mint(merchant1.address, 100);
    expect(await token.balanceOf(merchant1.address)).to.equal(100);
  });

  it("2. deposit tokens ", async () => {
    await token.connect(merchant1).approve(coTrainingContract.address, 100);
    await coTrainingContract.connect(merchant1).deposit(100);
    expect(await coTrainingContract.balanceOf(merchant1.address)).to.equal(100);
  });

  it("3. publish tasks", async () => {
    const bounty = 50;
    const tx = await coTrainingContract.connect(merchant1).publishTask(taskId, bounty);
    await tx.wait();
    expect(await coTrainingContract.balanceLocked(merchant1.address)).to.equal(50);
  });

  it("4. settlement", async () => {
    const bountyOrders = [
      [worker1.address, "10"],
      [worker2.address, "40"],
    ];

    settleTree = StandardMerkleTree.of(bountyOrders, ["address", "uint256"]);
    await coTrainingContract.settle(taskId, settleTree.root);
    expect(await coTrainingContract.balanceLocked(merchant1.address)).to.equal(0);
  });

  it("5. claim the bounty", async () => {
    for (const [i, v] of settleTree.entries()) {
      if (v[0] === worker1.address) {
        const proof = settleTree.getProof(i);
        let tx = await coTrainingContract.connect(worker1).claim(taskId, proof, 10);
        tx.wait();
        expect(await token.balanceOf(worker1.address)).to.equal(10);
      }
    }
    
  });

  it("6. withdraw money", async () => {
    await coTrainingContract.connect(merchant1).withdraw(50);
    expect(await token.balanceOf(merchant1.address)).to.equal(50);
  });
});
