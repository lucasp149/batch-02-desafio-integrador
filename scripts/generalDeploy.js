require("dotenv").config();
const walletAndIds = require("../wallets/walletList");

const {
  getRole,
  verify,
  ex,
  printAddress,
  deploySC,
  deploySCNoUp,
} = require("../utils");

const { getRootFromMT } = require("../utils/merkleTree");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

// Publicar NFT en Mumbai
async function deployMumbai() {

  var relAddMumbai= "0x4BD9fFFbF9eB4A927AFF4BC394658cdb217a1dD0";
  var root = getRootFromMT(walletAndIds);
  
  // utiliza deploySC
 var proxyAddress = await deploySC("CuyCollectionNft", [root]);  

  // utiliza printAddress
 var implAdd = await printAddress("CuyCollectionNft", await proxyAddress.getAddress());

  // utiliza ex (no termino de comprender cómo hay que pasar los parámetros)
  await ex(proxyAddress,"grantRole",[MINTER_ROLE,relAddMumbai],"Failed");

  // utiliza verify
  await verify(implAdd, "CuyCollectionNft");
}

// Publicar UDSC, Public Sale y Bbites Token en Goerli
async function deployGoerli() {
  var relAddGoerli = "0x5851395Dd3Aeed64362B95A038b88287B9210D72";

  var UniswapV2Router = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

  var contractUSDC    = await deploySCNoUp("USDCoin")
  var addressUSDC     = await contractUSDC.getAddress()

  var contractBBTKN   = await deploySC("BBitesToken")
  var addressBBTKN    = await contractBBTKN.getAddress()
  var impBT = await printAddress("BBitesToken", await contractBBTKN.getAddress());

  var contractPublicSale = await deploySC("PublicSale", [addressBBTKN, addressUSDC, UniswapV2Router])
  var impPS = await printAddress("PublicSale", await contractPublicSale.getAddress());

  // set up
  await ex(contractBBTKN,"grantRole",[MINTER_ROLE,relAddGoerli],"No pudo realizarse el procedimiento");

  // script para verificacion del contrato
  await verify(impBT, "BBitesToken");
  await verify(impPS, "PublicSale");
}

//deployMumbai()
   deployGoerli()
  //
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
