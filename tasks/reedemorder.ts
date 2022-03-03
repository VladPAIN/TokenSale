import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-web3";

task("reedemorder", "Reedem order in trade round")
    .addParam("id", "Id of order")
    .addParam("amount", "Amount tokens")
    .setAction(async (args) => {

        const acdm = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM);
        await (await acdm.reedemOrder(args.id, args.amount)).wait()
        console.log("You are successfully buy tokens");
 
    });

export default  {};