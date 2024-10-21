import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    // Local
    hardhat: {
      // forking: {
      //   url: "", // Forking URL
      // },
      // accounts: [
      //   {
      //     privateKey: vars.get("WALLET_PRIVATE_KEY"),
      //     balance: "1000000000000000000000000", // 100 Native Coin
      //   },
      // ],
    },
  },
};

export default config;
