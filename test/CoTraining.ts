import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("CoTrainingTest", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployBasicCoTraingFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, worker1, worker2, merchant1, merchant2] = await ethers.getSigners();

    const CoTrainingToken = await ethers.getContractFactory("CoTrainingToken");
    const ctt = await CoTrainingToken.deploy();

    await ctt.deployed();

    const CoTraing = await ethers.getContractFactory("CoTraining");
    const ct = await CoTraing.deploy(ctt.address);

    return { ctt, ct, owner, worker1, worker2, merchant1, merchant2 };
  }

  describe("Basic operations", async function () {
    
    it("Should set the right token basic settings", async function () {
      const { ctt, ct, owner, worker1, worker2, merchant1, merchant2 } = await loadFixture(
        deployBasicCoTraingFixture
      );
      expect(await ctt.name()).to.equal("CoTrainingToken");

      // 1. mint some tokens for test accounts
      await ctt.mint(owner.address, 100000);
      expect (await ctt.balanceOf(owner.address)).to.equal(100000);

      await ctt.mint(worker1.address, 100);
      expect (await ctt.balanceOf(worker1.address)).to.equal(100);
      
      // 2. deposit tokens
      // await ctt.connect(worker1).approve(ctt.address, 100);
      await ct.connect(worker1).deposit(100);
      
      expect (await ctt.allowance(worker1.address, ctt.address)).to.equal(100);

      // expect (await ctt.balanceOf(worker1.address)).to.equal(0);
      // expect (await ct.balanceLocked(worker1.address)).to.equal(100);

    });
  });
});
