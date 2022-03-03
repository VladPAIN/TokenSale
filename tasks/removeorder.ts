import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-web3";

task("removeorder", "Remove order in trade round")
    .addParam("id", "Id of order")
    .setAction(async (args) => {

        const acdm = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM);
        await (await acdm.removeOrder(args.id)).wait()
        console.log("You are successfully removed your order");
 
    });

export default  {};