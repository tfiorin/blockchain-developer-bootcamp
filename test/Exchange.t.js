const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

describe("Exchange", () => {  
    let exchange, deployer, feeAccount, token1, user1, token2;

    const feePercent = 10;

    beforeEach(async () => {
        let accounts = await ethers.getSigners();
        deployer = accounts[0];
        feeAccount = accounts[1];
        user1 = accounts[2];

        const Token = await ethers.getContractFactory("Token");
        const Exchange = await ethers.getContractFactory("Exchange");

        token1 = await Token.deploy("Dapp University","DAPP", 1000000);
        token2 = await Token.deploy("Mock Dai","MDAI", 1000000);

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
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();                

                //Deposit tokens
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
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
                await expect(exchange.connect(user1).depositToken(token1.address, tokens(100))).to.be.reverted;
            });
        });
    });

    describe("Withdrawing Tokens", () => {
        describe("Success", () => {
            let amount, transaction, result;

            beforeEach(async () => {
                amount = tokens(10);

                //Approve the exchange to spend the tokens
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();   

                //Deposit tokens
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                result = await transaction.wait();

                //Withdraw tokens
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount);
                result = await transaction.wait();
            });
    
            it("tracks the token withdrawal", async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0);
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0);
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0);
            });

            it('emits a Withdraw event', async () => {
                const event = result.events[1]; // 2 events are emitted
                expect(event.event).to.equal('Withdraw');
        
                const args = event.args;
                expect(args.token).to.equal(token1.address);
                expect(args.user).to.equal(user1.address);
                expect(args.amount).to.equal(amount);
                expect(args.balance).to.equal(0);
              })
        });

        describe("Failure", () => {
            it("rejects insufficient balance", async () => {
                await expect(exchange.connect(user1).withdrawToken(token1.address, tokens(10))).to.be.reverted;
            });
        });
    });

    describe("Checking Balances", () => {
        let amount, transaction, result;

        beforeEach(async () => {
            amount = tokens(1);

            //Approve the exchange to spend the tokens
            transaction = await token1.connect(user1).approve(exchange.address, amount);
            result = await transaction.wait();   

            //Deposit tokens
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            result = await transaction.wait();
        });

        it("returns user balance", async () => {
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount);
        });
    });

    describe("Making Orders", () => {
        let amount, transaction, result;
        amount = tokens(1);

        describe("Success", () => {
            let orderId, price;

            beforeEach(async () => {
                //Approve the exchange to spend the tokens
                transaction = await token1.connect(user1).approve(exchange.address, amount);
                result = await transaction.wait();   

                //Deposit tokens
                transaction = await exchange.connect(user1).depositToken(token1.address, amount);
                result = await transaction.wait();
                
                //Make order
                transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount);
                result = await transaction.wait();
            });

            it("tracks the order", async () => {
                expect(await exchange.orderCount()).to.equal(1);
            });

            it('emits an Order event', async () => {
                const event = result.events[0]; // 2 events are emitted
                expect(event.event).to.equal('Order');
        
                const args = event.args;
                expect(args.id).to.equal(1);
                expect(args.tokenGet).to.equal(token2.address);
                expect(args.amountGet).to.equal(amount);
                expect(args.tokenGive).to.equal(token1.address);
                expect(args.amountGive).to.equal(amount);
                expect(args.user).to.equal(user1.address);
                expect(args.timestamp).to.exist;
              })
        });

        describe("Failure", () => {
            it("rejects invalid token", async () => {
                await expect(exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)).to.be.reverted;
            });
        });
    });

    describe("Order actions", async() => { 

        beforeEach(async () => {
            let amount = tokens(10);

            //Approve the exchange to spend the tokens
            let transaction = await token1.connect(user1).approve(exchange.address, amount);
            await transaction.wait();   

            //Deposit tokens
            transaction = await exchange.connect(user1).depositToken(token1.address, amount);
            await transaction.wait();

            //Make order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount);
            await transaction.wait();
        });

        describe("Cancelling orders", async() => {
            
            describe("Success", async() => {
                beforeEach(async() => {
                    let transaction = await exchange.connect(user1).cancelOrder(1);
                    await transaction.wait();
                });

                it("tracks the order cancellation", async() => {
                    expect(await exchange.orderCancelled(1)).to.equal(true);
                });
                
            });

            describe("Failure", async() => {
                
            });
        });
    });
});
