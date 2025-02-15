require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const privateKey = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      localhost: {}
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}",
      accounts: privateKey.split(',')
    }
  },
};
