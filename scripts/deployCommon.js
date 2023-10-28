var { ethers } = require("hardhat");

async function main() {

  const miPrimerToken = await ethers.deployContract("balance");
  console.log(`Address deployed: ${await miPrimerToken.getAddress()}`);

  // Espera 10 confirmaciones
  var res = await miPrimerToken.waitForDeployment();
  await res.deploymentTransaction().wait(10);

  await hre.run("verify:verify", {
    address: await miPrimerToken.getAddress(),
    constructorArguments: [],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1; // exitcode quiere decir fallor por error, terminacion fatal
});
