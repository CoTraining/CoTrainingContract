import { ethers } from "hardhat";

async function main() {
 
  const CoTrainingToken = await ethers.getContractFactory("CoTrainingToken");
  const ctt = await CoTrainingToken.deploy();

  await ctt.deployed();

  console.log(`CoTraining deployed successfully, address: ${ctt.address}`);

  const CoTraing = await ethers.getContractFactory("CoTraining");
  const ct = await CoTraing.deploy(ctt.address);

  console.log(`CoTraining deployed successfully, address: ${ct.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
