import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-web3";

task("buyacdm", "Buy ACDM token in sale round")
    .addParam("amount", "Amount tokens")
    .setAction(async (args) => {

        const acdm = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM);
        await (await acdm.buyACDM(args.amount)).wait()
        console.log("You have successfully buy ACDM token");
 
    });

export default  {};