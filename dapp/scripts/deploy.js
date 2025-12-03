const hre = require("hardhat");

async function main() {
  const certRegistry = await hre.ethers.deployContract("CertificateRegistry");
  await certRegistry.waitForDeployment();
  console.log("CertificateRegistry deployed to:", certRegistry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});