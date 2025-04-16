require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();  // Add this line to load .env variables
// require("@nomiclabs/hardhat-ethers"); 

const { TESTNET_URL, PRIVATE_KEY } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: TESTNET_URL,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
};
