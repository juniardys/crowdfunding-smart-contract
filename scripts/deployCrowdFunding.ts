import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the CrowdFunding
  const CrowdFundingFactory = await ethers.getContractFactory("CrowdFunding");
  const crowdFunding = await CrowdFundingFactory.deploy();
  await crowdFunding.waitForDeployment();
  const crowdFundingAddress = await crowdFunding.getAddress();
  console.log("CrowdFunding deployed to:", crowdFundingAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
