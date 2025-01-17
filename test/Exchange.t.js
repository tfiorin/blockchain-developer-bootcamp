const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

describe("Exchange", () => {  
    let exchange, deployer, feeAccount, token1, user1;

    const feePercent = 10;

    beforeEach(async () => {
        let accounts = await ethers.getSigners();
        deployer = accounts[0];
        feeAccount = accounts[1];
        user1 = accounts[2];

        const Token = await ethers.getContractFactory("Token");
        const Exchange = await ethers.getContractFactory("Exchange");

        token1 = await Token.deploy("Dapp University","DAPP", 1000000);

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100));
        await transaction.wait();
        
        exchange = await Exchange.deploy(feeAccount.address, feePercent);
    });

    describe("Deployment", () => {
        it("tracks the fee account", async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address);
        });

        it("tracks the fee percent", async () => {
            expect(await exchange.feePercent()).to.equal(feePercent);
        });
    });
    
    describe("Depositing Tokens", () => {
        describe("Success", () => {
            let amount, transaction, result;

            beforeEach(async () => {
                amount = tokens(10);

                //Approve the exchange to spend the tokens
                transaction = await exchange.connect(user1).depositToken("DAPP", amount);
                result = await transaction.wait();

                //Deposit tokens
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();
            });
    
            it("tracks the token deposit", async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount);
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount);
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
            });

            it('emits a Deposit event', async () => {
                const event = result.events[1]; // 2 events are emitted
                expect(event.event).to.equal('Deposit');
        
                const args = event.args;
                expect(args.token).to.equal(token1.address);
                expect(args.user).to.equal(user1.address);
                expect(args.amount).to.equal(amount);
                expect(args.balance).to.equal(amount);
              })
        });

        describe("Failure", () => {
            it("rejects invalid token", async () => {
                await expect(exchange.connect(user1).depositToken(token1.address, tokens(100))).to.be.revertedWith("invalid token");
            });
        });
    });
});