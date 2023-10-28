const { ethers, upgrades } = require("hardhat");
const walletAndIds = require("../wallets/walletList");
const { getRootFromMT } = require("../utils/merkleTree");
async function main() {
    // obtener el codigo del contrato
    var UpgradeableToken = await ethers.getContractFactory("PublicSale");

    const token = "0x820C1a94A623Fb12B7ae32baE7906c0C64699C7C";
    const usdc = "0x42b2cd695bb9aD2E2e1b88A1b5730397FF3e182D";
    const router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    var root = getRootFromMT(walletAndIds);
    // publicar el proxy
    var upgradeableToken = await upgrades.deployProxy(
        UpgradeableToken,
        [token, usdc, router], 
        {kind: "uups"},
    );
    // esperar a que se confirme el contrato
    var tx = await upgradeableToken.waitForDeployment();
    await tx.deploymentTransaction().wait(5);

    // obtenemos el address de implementacion
    var implementationAdd = await upgrades.erc1967.getImplementationAddress(await upgradeableToken.getAddress());

    console.log(`Address del Proxy es: ${await upgradeableToken.getAddress()}`);
    console.log(`Address de Impl es: ${implementationAdd}`);

    // Hacemos la verificacion del address de implementacion
    await hre.run("verify:verify", {
        address: implementationAdd,
        constructorArguments: [],
    });

}

async function upgrade() {
    const ProxyAddress = "";
    const OCTokenUpgradeableV2 = await ethers.getContractFactory("BBitesToken");
    const ocTokenUpgradeableV2 = await upgrades.upgradeProxy(ProxyAddress, OCTokenUpgradeableV2);

    // esperar unas confirmaciones

    var implementationAddV2 = await upgrades.erc1967.getImplementationAddress(ProxyAddress);
    console.log(`Address del Proxy es: ${ProxyAddress}`);
    console.log(`Address de Impl es: ${implementationAddV2}`);

    await hre.run("verify:verify", {
        address: implementationAddV2,
        constructorArguments: [],
    });
}

main().catch((error) => {
    console.log(error);
    process.exitCode = 1;
});

// upgrade().catch((error) => {
//     console.log(error);
//     process.exitCode = 1;
// });