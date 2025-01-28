const config = require('../src/config.json');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

const wait = (seconds) => {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function main() {
    //fetch accounts
    const accounts = await ethers.getSigners();

    // Fetch network
    const { chainId } = await ethers.provider.getNetwork();
    console.log("Using chainId:", chainId);

    const DApp = await ethers.getContractAt("Token", config[chainId].DApp.address);
    console.log(`DAPP deployed to: ${DApp.address}`);
    
    const mETH = await ethers.getContractAt("Token", config[chainId].mETH.address);
    console.log(`mETH deployed to: ${mETH.address}`);
    
    const mDAI = await ethers.getContractAt("Token", config[chainId].mDAI.address);
    console.log(`mDAI deployed to: ${mDAI.address}`);
    
    const exchange = await ethers.getContractAt("Exchange", config[chainId].exchange.address);  
    console.log(`Exchange deployed to: ${exchange.address}`);

    const sender = accounts[0];     // ->deployer
    const receiver = accounts[1];   

    // user1 transfer 10,000 mETH
    let transaction, result;
    let amount = tokens(10000);

    transaction = await mETH.connect(sender).transfer(receiver.address, amount);
    console.log(`Transfered ${amount} mETH from ${sender.address} to ${receiver.address}`);

    const user1 = accounts[0];
    const user2 = accounts[1];
    amount = tokens(10000);

    //user1 aproves exchange to spend 10,000 DAPP
    transaction = await DApp.connect(user1).approve(exchange.address, amount);
    await transaction.wait();
    console.log(`Approved ${amount} tokens for ${user1.address}`);

    //user1 deposits 10,000 DAPP
    transaction = await exchange.connect(user1).depositToken(DApp.address, amount);
    await transaction.wait();
    console.log(`Deposited ${amount} Ether from ${user1.address}`);

    //user2 aproves exchange to spend 10,000 DAPP
    transaction = await mETH.connect(user2).approve(exchange.address, amount);
    await transaction.wait();
    console.log(`Approved ${amount} tokens for ${user2.address}`);

    //user1 deposits 10,000 DAPP
    transaction = await exchange.connect(user2).depositToken(mETH.address, amount);
    await transaction.wait();
    console.log(`Deposited ${amount} tokens from ${user2.address}`);

    /////////////////////////////
    // send a cancelled order
    /////////////////////////////
    let orderId;
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(5));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user1).cancelOrder(orderId);
    result = await transaction.wait();
    console.log(`Cancelled order from ${user1.address}`);

    wait(1);

    /////////////////////////////
    // send filled orders
    /////////////////////////////

    //user1 makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(100), DApp.address, tokens(10));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    //user2 fills order
    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderId);
    await transaction.wait();
    console.log(`Filled order from ${user1.address}`);

    // Wait 1 second
    wait(1);

    //user1 another makes order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(50), DApp.address, tokens(15));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    //user2 fills another order
    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderId);
    result = await transaction.wait();
    console.log(`Filled order from ${user1.address}`);

    // Wait 1 second
    wait(1);

    //user1 another final order
    transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(200), DApp.address, tokens(20));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    //user2 another makes order
    orderId = result.events[0].args.id;
    transaction = await exchange.connect(user2).fillOrder(orderId);
    result = await transaction.wait();
    console.log(`Filled order from ${user1.address}`);

    // Wait 1 second
    wait(1);

    /////////////////////////////
    // Seed Open Orders
    /////////////////////////////

    // User 1 makes 10 orders
    for(let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), DApp.address, tokens(10));
        result = await transaction.wait();

        console.log(`Made order from ${user1.address}`);

        // Wait 1 second
        await wait(1);
    }

    // User 2 makes 10 orders
    for (let i = 1; i <= 10; i++) {
        transaction = await exchange.connect(user2).makeOrder(DApp.address, tokens(10), mETH.address, tokens(10 * i));
        result = await transaction.wait();

        console.log(`Made order from ${user2.address}`);

        // Wait 1 second
        await wait(1);
    }

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
  });
