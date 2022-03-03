import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-web3";

task("starttraderound", "Start trade round")
    .setAction(async () => {

        const acdm = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM);
        await (await acdm.starttraderound()).wait()
        console.log("Trade round start");
 
    });

export default  {};