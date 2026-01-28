const hre = require("hardhat");

async function main() {
  const [deployer, authority] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log("Authority account:", authority.address);

  const LegacyChain = await hre.ethers.getContractFactory("LegacyChain");
  const legacyChain = await LegacyChain.deploy(authority.address);

 
  await legacyChain.waitForDeployment();

  const contractAddress = await legacyChain.getAddress();
  console.log("LegacyChain deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
