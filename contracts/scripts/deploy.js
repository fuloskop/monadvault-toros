const hre = require("hardhat");

async function main() {
  console.log("🦊 Deploying Foxie Casino...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MON\n");

  // Deploy the casino contract
  const FoxieCasino = await hre.ethers.getContractFactory("FoxieCasino");
  const casino = await FoxieCasino.deploy();
  await casino.waitForDeployment();

  const casinoAddress = await casino.getAddress();
  console.log("✅ FoxieCasino deployed to:", casinoAddress);

  // Fund the house with initial bankroll
  const initialBankroll = hre.ethers.parseEther("1"); // 1 MON initial bankroll
  
  console.log("\n💰 Depositing initial bankroll...");
  const depositTx = await casino.depositHouse({ value: initialBankroll });
  await depositTx.wait();
  
  const houseBalance = await casino.getHouseBalance();
  console.log("House balance:", hre.ethers.formatEther(houseBalance), "MON");

  console.log("\n🎰 Casino is ready!");
  console.log("=====================================");
  console.log("Contract Address:", casinoAddress);
  console.log("Owner:", deployer.address);
  console.log("House Edge:", "2%");
  console.log("Min Bet:", "0.001 MON");
  console.log("Max Bet:", "10 MON");
  console.log("=====================================");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: casinoAddress,
    owner: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

