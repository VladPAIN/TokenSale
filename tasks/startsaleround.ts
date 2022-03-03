import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-web3";

task("startsaleround", "Start sale round")
    .setAction(async () => {

        const acdm = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM);
        await (await acdm.startSaleRound()).wait()
        console.log("Sale round start");
 
    });

export default  {};