require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mumbai: {
      url: process.env.MUMBAI_TESNET_URL,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 0,
      gas: "auto", // maximo de gas a gastar en la transaccion
      gasPrice: "auto", // techo del precio de gas

    },
    sepolia: {
      url: process.env.SEPOLIA_TESNET_URL,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 0,
      gas: "auto",
      gasPrice: "auto",
    },
    goerli: {
      url: process.env.GOERLI_TESNET_URL,
      accounts: [process.env.PRIVATE_KEY || ""],
      timeout: 20000,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.API_KEY_POLYGONSCAN,
      sepolia: process.env.API_KEY_ETHERSCAN,
      goerli: process.env.API_KEY_ETHERSCAN,
    },
  },
  
};
