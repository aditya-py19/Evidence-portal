import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying EvidenceRegistry contract...");

  const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
  const registry = await EvidenceRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  const network = await hre.ethers.provider.getNetwork();

  const networkName = network.chainId === 80002n ? "Polygon Amoy Testnet" : `Chain ID ${network.chainId}`;

  console.log(`EvidenceRegistry deployed successfully to: ${contractAddress}`);
  console.log(`Network: ${networkName} (Chain ID: ${network.chainId})`);

  // Read ABI from artifact
  const artifactPath = path.resolve("./artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentData = {
    contractAddress,
    networkName,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const outputDir = path.resolve("./contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.resolve("./contracts/deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2), "utf8");
  console.log(`Deployment metadata saved to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
