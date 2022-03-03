const { expect } = require('chai');
const { waffle} = require("hardhat");
const { expectRevert, time } = require('@openzeppelin/test-helpers');
const web3 = require('web3');
const { keccak256, toUtf8Bytes } = require("ethers/lib/utils");

const STATUS = {
    SaleRound: 0,
    TradeRound: 1,
    End: 2
};

describe('Contract: ACDMPlatform', () => {

	let Token, token, ACDM, acdm, owner, addr1, addr2, addr3;

	const TOTAL_SUPPLY = ethers.utils.parseUnits("10000", process.env.TOKEN_DECIMALS);
    const roundTime = 259200;

    beforeEach(async () => {

		[owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

        Token = await hre.ethers.getContractFactory("Token");
        ACDM = await hre.ethers.getContractFactory("ACDMPlatform");

        token = await Token.deploy('ACDMPlatform', 'ACDM');
        acdm = await ACDM.deploy(token.address, roundTime);    
        
        const minter = keccak256(toUtf8Bytes("MINTER"));
        const burner = keccak256(toUtf8Bytes("BURNER"));

        await token.grantRole(minter, acdm.address);
		await token.grantRole(burner, acdm.address);

    });

	describe("Register", function () {

        it('Should register on platform', async function () {

        	await acdm.connect(addr1).register(addr2.address);
			
			expect(await acdm.connect(addr1).getReferrer()).to.equal(addr2.address);

            await expect(acdm.connect(addr1).register(addr2.address)).to.be.revertedWith('You are registred');
            await expect(acdm.getReferrer()).to.be.revertedWith('You are not registred');

    	});

        it('Should get % of the referrals purchase after sale round', async function () {

            await acdm.connect(addr2).register(owner.address);
        	await acdm.connect(addr1).register(addr2.address);
			
            expect(await acdm.connect(addr2).getReferrer()).to.equal(owner.address);
			expect(await acdm.connect(addr1).getReferrer()).to.equal(addr2.address);

            await acdm.startSaleRound();

            const ethAddr2Before = await addr2.getBalance();
            const ethOwnerBefore = await owner.getBalance();

            await acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});

            const ethAddr2After = await addr2.getBalance();
            const ethOwnerAfter = await owner.getBalance();

            expect(ethAddr2After).to.be.equal(ethAddr2Before.add(hre.ethers.utils.parseEther("0.0005")));
            expect(ethOwnerAfter).to.be.equal(ethOwnerBefore.add(hre.ethers.utils.parseEther("0.0003")));

    	});

        it('Should get % of the referrals purchase after trade round', async function () {

            await acdm.connect(addr2).register(owner.address);
        	await acdm.connect(addr1).register(addr2.address);
			
            expect(await acdm.connect(addr2).getReferrer()).to.equal(owner.address);
			expect(await acdm.connect(addr1).getReferrer()).to.equal(addr2.address);

            await acdm.startSaleRound();
            await acdm.connect(addr3).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});
            await time.increase(259201);
            await acdm.startTradeRound();

            const ethAddr2Before = await addr2.getBalance();
            const ethOwnerBefore = await owner.getBalance();

            await token.connect(addr3).approve(acdm.address, ethers.utils.parseUnits("1000", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr3).addOrder(1000, ethers.utils.parseUnits("0.01", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr1).reedemOrder(1, 1000, {value: hre.ethers.utils.parseEther("10")});

            const ethAddr2After = await addr2.getBalance();
            const ethOwnerAfter = await owner.getBalance();

            expect(ethAddr2After).to.be.equal(ethAddr2Before.add(hre.ethers.utils.parseEther("0.25")));
            expect(ethOwnerAfter).to.be.equal(ethOwnerBefore.add(hre.ethers.utils.parseEther("0.25")));

    	});

    });

    describe("Create token sale round", function () {

        it('Should start sale round', async function () {

            
        	await acdm.startSaleRound();
			
			expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("100000", process.env.TOKEN_DECIMALS));

            await expect(acdm.connect(addr1).startSaleRound()).to.be.revertedWith('Caller is not a admin');

    	});

        it('Should start sale round after zero totalBuy in trade round', async function () {

        	await acdm.startSaleRound();
            await time.increase(259201);
            await acdm.startTradeRound();
            await time.increase(259201);
            await acdm.startSaleRound();
			
			expect(await acdm.getStatusRound(1)).to.equal(STATUS.SaleRound);

    	});

        it('Should start sale round after trade round', async function () {

        	await acdm.startSaleRound();
            await acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});

            await time.increase(259201);
            await acdm.startTradeRound();
            await token.connect(addr1).approve(acdm.address, ethers.utils.parseUnits("1000", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr1).addOrder(1000, ethers.utils.parseUnits("0.01", process.env.TOKEN_DECIMALS))

            await acdm.connect(addr2).reedemOrder(1, 1000, {value: hre.ethers.utils.parseEther("10")});
            expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("0", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits("1000", process.env.TOKEN_DECIMALS));

            await time.increase(259201);

            await acdm.startSaleRound();
			
			expect(await acdm.getStatusRound(1)).to.equal(STATUS.SaleRound);

    	});

        it('Should buy tokens in sale round', async function () {
  
        	await acdm.startSaleRound();
			
			expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("100000", process.env.TOKEN_DECIMALS));

            await expect(acdm.connect(addr1).buyACDM(1000000, {value: hre.ethers.utils.parseEther("10")})).to.be.revertedWith('Dont have enough tokens');
            await expect(acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.001")})).to.be.revertedWith('You dont have enough ETH');

            await acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});
            await acdm.connect(addr2).buyACDM(2000, {value: hre.ethers.utils.parseEther("0.02")});

            expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("1000", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits("2000", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("97000", process.env.TOKEN_DECIMALS));

    	});

    });

    describe("Start trade round", function () {

        it('Should start trade round', async function () {

            await expect(acdm.connect(addr1).startSaleRound()).to.be.revertedWith('Caller is not a admin');
            await acdm.startSaleRound();


            await expect(acdm.startTradeRound()).to.be.revertedWith('Sale round not finished');
            await time.increase(259201);

            await acdm.startTradeRound();

            await expect(acdm.startTradeRound()).to.be.revertedWith('Offer is ended or trade round is underway');
			expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("0", process.env.TOKEN_DECIMALS));
            

        }); 

        it('Should add order ACDM tokens in trade round', async function () {

            await acdm.startSaleRound();
            await acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});
            await expect(acdm.connect(addr1).addOrder(ethers.utils.parseUnits("100", process.env.TOKEN_DECIMALS), ethers.utils.parseUnits("0.001", process.env.TOKEN_DECIMALS)))
                                                                                                                                    .to.be.revertedWith('Not a trade round now');
            await time.increase(259201);

            await acdm.startTradeRound();
            await expect(acdm.connect(addr1).addOrder(ethers.utils.parseUnits("10000", process.env.TOKEN_DECIMALS), ethers.utils.parseUnits("0.001", process.env.TOKEN_DECIMALS)))
                                                                                                                                    .to.be.revertedWith('You dont have enough tokens');

            await token.connect(addr1).approve(acdm.address, ethers.utils.parseUnits("100", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr1).addOrder(100, ethers.utils.parseUnits("0.001", process.env.TOKEN_DECIMALS));

			expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("100", process.env.TOKEN_DECIMALS));
            

        }); 

        it('Should cancel order ACDM tokens in trade round', async function () {

            await acdm.startSaleRound();
            await acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});
            
            await time.increase(259201);

            await acdm.startTradeRound();

            await token.connect(addr1).approve(acdm.address, ethers.utils.parseUnits("100", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr1).addOrder(100, ethers.utils.parseUnits("0.001", process.env.TOKEN_DECIMALS));
            await expect(acdm.removeOrder(1)).to.be.revertedWith('Caller is not a owner');
            await acdm.connect(addr1).removeOrder(1);

			expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("0", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("1000", process.env.TOKEN_DECIMALS));           

        }); 

        it('Should reedem ACDM tokens in trade round', async function () {

            await acdm.startSaleRound();
            await acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});
            await time.increase(259201);

            await acdm.startTradeRound();
            
            await token.connect(addr1).approve(acdm.address, ethers.utils.parseUnits("100", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr1).addOrder(100, ethers.utils.parseUnits("0.1", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr2).reedemOrder(1, 50, {value: hre.ethers.utils.parseEther("5")})
            await acdm.connect(addr1).removeOrder(1);

            //console.log(await addr1.getBalance());
            //console.log(await addr2.getBalance());

			expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("950", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits("50", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("0", process.env.TOKEN_DECIMALS));

        }); 

        it('Should return tokens if they are not sold in trade round', async function () {

            await acdm.startSaleRound();
            await acdm.connect(addr1).buyACDM(1000, {value: hre.ethers.utils.parseEther("0.01")});
            await time.increase(259201);

            await acdm.startTradeRound();
            
            await token.connect(addr1).approve(acdm.address, ethers.utils.parseUnits("100", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr1).addOrder(100, ethers.utils.parseUnits("0.1", process.env.TOKEN_DECIMALS));
            await acdm.connect(addr2).reedemOrder(1, 50, {value: hre.ethers.utils.parseEther("5")})

            await time.increase(259201);   
            await acdm.startSaleRound();         

			expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits("950", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits("50", process.env.TOKEN_DECIMALS));
            expect(await token.balanceOf(acdm.address)).to.equal(ethers.utils.parseUnits("500000", process.env.TOKEN_DECIMALS));

        }); 

    });

});