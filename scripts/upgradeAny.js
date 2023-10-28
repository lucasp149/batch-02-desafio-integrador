const { ethers, upgrades } = require("hardhat");
   
   async function upgrade() {
     const ProxyAddress = "0xA77a6c9D897DA6cf831B705E5aA7f228FB5BF4E3";
     const LMTokenUpgradeableV2 = await ethers.getContractFactory(
       "UpCuyCollectionNft"
     );
     const lmTokenUpgradeableV2 = await upgrades.upgradeProxy(
       ProxyAddress,
       LMTokenUpgradeableV2
     );
   
     // esperar unas confirmaciones
   
     var implV2 = await upgrades.erc1967.getImplementationAddress(ProxyAddress);
     console.log(`Address Proxy: ${ProxyAddress}`);
     console.log(`Address Impl V2: ${implV2}`);
   
     await hre.run("verify:verify", {
       address: implV2,
       constructorArguments: [],
     });
   }
   
   upgrade().catch((error) => {
     console.error(error);
     process.exitCode = 1; // nodeJs | 1 significa que falló la operación
   });