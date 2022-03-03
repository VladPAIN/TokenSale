import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-web3";

task("register", "Register")
    .addParam("address", "Address referrer")
    .setAction(async (args) => {

        const acdm = await hre.ethers.getContractAt("ACDMPlatform", process.env.ACDM_PLATFORM);
        await (await acdm.register(args.address)).wait()
        console.log("You have successfully registered");
 
    });

export default  {};