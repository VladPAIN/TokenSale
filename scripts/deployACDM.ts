const { ethers } = require("ethers");
const hre = require("hardhat");

require("dotenv").config();

async function deployBridge() {
  const ACDMPlatform = await hre.ethers.getContractFactory("ACDMPlatform");


  const acdm = await ACDMPlatform.deploy(process.env.TOKEN, 259200);
  console.log("ACDMPlatform address: ", acdm.address);
  await acdm.deployed();

  await new Promise((resolve) => setTimeout(resolve, 60000));

  try {
    await hre.run("verify:verify", {
      address: acdm.address,
      contract: "contracts/ACDMPlatform.sol:ACDMPlatform",
      constructorArguments: [process.env.TOKEN, 259200],
    });
    console.log("verify success");
  } catch (e) {
    console.log(e);
  }
}

deployBridge()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });