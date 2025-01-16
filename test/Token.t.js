const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

describe("Token", () => {  
    let token, accounts, deployer, receiver, exchange;

    beforeEach(async () => {
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Dapp University","DAPP", 1000000);

        accounts = await ethers.getSigners();
        deployer = accounts[0];
        receiver = accounts[1];
        exchange = accounts[2];
    });

    describe("Deployment", () => {
        const name = "Dapp University";
        const symbol = "DAPP";
        const totalSupply = tokens("1000000");
        const decimals = 18;
        
        it("has correct name", async () => {
            expect(await token.name()).to.equal(name);        
        });
    
        it("has correct symbol", async () => {
            expect(await token.symbol()).to.equal(symbol);
        });
    
        it("has correct decimals", async () => {
            expect(await token.decimals()).to.equal(decimals);
        });
    
        it("has correct total supply", async () => {
            expect(await token.totalSupply()).to.equal(totalSupply);
        });

        it("assigns total supply to deployer", async () => {
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
        });
    });   
    
    describe("Sending Tokens", () => {
        let amount, transaction, result;

        describe("Success", () => {
            beforeEach(async () => {
                amount = tokens(100);
                transaction = await token.connect(deployer).transfer(receiver.address, amount);
                result = transaction.wait();
            });
    
            it("transfers token balance", async () => {
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
                expect(await token.balanceOf(receiver.address)).to.equal(amount);
            });
    
            it("emits Transfer event", async () => {
                expect(transaction).to.emit(token, "Transfer").withArgs(deployer.address, receiver.address, amount);
            });
        });

        describe("Failure", () => {
            it("rejects insufficient balance", async () => {
                amount = tokens(1000001);
                await expect(token.connect(deployer).transfer(receiver.address, amount)).to.be.revertedWith("Insufficient balance");
            });
    
            it("rejects invalid recipient", async () => {
                amount = tokens(100);
                await expect(token.connect(deployer).transfer(ethers.constants.AddressZero, amount)).to.be.revertedWith("Invalid address");
            });
        });
    });

    describe("Approving Tokens", () => {
        let amount, transaction, result;

        beforeEach(async () => {
            amount = tokens(100);
            transaction = await token.connect(deployer).approve(exchange.address, amount);
            result = transaction.wait();
        });

        describe("Success", () => {           
    
            it("approves token spending", async () => {
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount);
            });
    
            it("emits Approval event", async () => {
                expect(transaction).to.emit(token, "Approval").withArgs(deployer.address, exchange.address, amount);
            });
        });

        describe("Failure", () => {
            it("rejects invalid spender", async () => {
                amount = tokens(100);
                await expect(token.connect(deployer).approve(ethers.constants.AddressZero, amount)).to.be.revertedWith("Invalid address");
            });
        });
        
    });
});