import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-web3";

task("addorder", "Add order in trade round")
    .addParam("amount", "Amount tokens")
    .addParam("price", "Price per token")
    .setAction(async (args) => {

        const acdm = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM);
        await (await acdm.addOrder(args.amount, args.price)).wait()
        console.log("You are successfully listed your order");
 
    });

export default  {};