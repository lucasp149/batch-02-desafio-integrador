import { Contract, ethers } from "ethers";

import usdcTknAbi from "../artifacts/contracts/USDCoin.sol/USDCoin.json";
import bbitesTokenAbi from "../artifacts/contracts/BBitesToken.sol/BBitesToken.json";
import publicSaleAbi from "../artifacts/contracts/PublicSale.sol/PublicSale.json";
import nftTknAbi from "../artifacts/contracts/CuyCollectionNft.sol/CuyCollectionNft.json";

// SUGERENCIA: vuelve a armar el MerkleTree en frontend
// Utiliza la libreria buffer
import buffer from "buffer/";
import walletAndIds from "../wallets/walletList";
import { MerkleTree } from "merkletreejs";
var Buffer = buffer.Buffer;
var merkleTree;
var root;

function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}
function getMerkleFromMT() {
  var elementosHasheados = walletAndIds.map(({ id, address }) => {
    return hashToken(id, address);
  });
  merkleTree = new MerkleTree(elementosHasheados, ethers.keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();
  console.log(root);
  return merkleTree;
}
function getRootFromMT(lista) {
  var elementosHasheados = lista.map(({ id, address }) => {
    return hashToken(id, address);
  });
  merkleTree = new MerkleTree(elementosHasheados, ethers.keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();
  //console.log(root);

  return root;
}
function construyendoPruebas(tokenId, account) {
  // var tokenId = 7;
  //var account = "0x00b7cda410001f6e52a7f19000b3f767ec8aec7d";
  merkleTree = getMerkleFromMT();
  root = getRootFromMT(walletAndIds);
  var hasheandoElemento = hashToken(tokenId, account);

  var pruebas = merkleTree.getHexProof(hasheandoElemento);
  //return pruebas;

  // verificacion off-chain
  //var pertenece = merkleTree.verify(pruebas, hasheandoElemento, root);
  //console.log("Pertenece:" + pertenece);

  return pruebas;
}

var provider, signer, account, chainId;
var usdcTkContract, bbitesTknContract, pubSContract, nftContract;
var usdcAddress, bbitesTknAdd, pubSContractAdd;

//async function setUpMetamask() {
var bttn = document.getElementById("connect");

var walletIdEl = document.getElementById("walletId");

bttn.addEventListener("click", async function () {
  if (window.ethereum) {
    // valida que exista la extension de metamask conectada
    [account] = await ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log("Billetera metamask", account);
    walletIdEl.innerHTML = account;

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner(account);

    chainId = await window.ethereum.request({ method: "eth_chainId" });
    console.log(chainId);
  }
});
//}

function setUpListeners() {
  // Connect to Metamask
  var bttn = document.getElementById("connect");
  var walletIdEl = document.getElementById("walletId");
  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);
      walletIdEl.innerHTML = account;
      signer = await provider.getSigner(account);
      console.log("Signer: " + signer);
    }
  });

  // USDC Balance - balanceOf
  var bttn = document.getElementById("usdcUpdate");

  bttn.addEventListener("click", async function () {
    if (checkNetwork("g")) {
      var balance = await usdcTkContract.balanceOf(account);
      var balanceEl = document.getElementById("usdcBalance");
      balanceEl.innerHTML = ethers.formatUnits(balance, 6);
    }
  });

  // Bbites token Balance - balanceOf
  var bttn = document.getElementById("bbitesTknUpdate");
  bttn.addEventListener("click", async function () {
    if (checkNetwork("g")) {
      var balance = await bbitesTknContract.balanceOf(account);
      var balanceEl = document.getElementById("bbitesTknBalance");
      balanceEl.innerHTML = ethers.formatUnits(balance, 18);
    }
  });

  // APPROVE BBTKN
  // bbitesTknContract.approve
  var bttn = document.getElementById("approveButtonBBTkn");
  cleanError("approveError");
  bttn.addEventListener("click", async function () {
    document.getElementById("approveError").textContent = "";
    var approveInput = document.getElementById("approveInput").value;
    if (checkNetwork("g")) {
      try {
        var tx = await bbitesTknContract
          .connect(signer)
          .approve(pubSContractAdd, approveInput);
        var res = await tx.wait();
        console.log(res.hash);
      } catch (error) {
        document.getElementById("approveError").textContent = error;
        console.log(error);
      }
    }
  });

  // APPROVE USDC
  // usdcTkContract.approve
  var bttn = document.getElementById("approveButtonUSDC");
  cleanError("approveErrorUSDC");
  bttn.addEventListener("click", async function () {
    document.getElementById("approveErrorUSDC").textContent = "";
    var approveInput = document.getElementById("approveInputUSDC").value;
    if (checkNetwork("g")) {
      try {
        var tx = await usdcTkContract
          .connect(signer)
          .approve(pubSContractAdd, approveInput);
        var res = await tx.wait();
        console.log(res.hash);
      } catch (error) {
        document.getElementById("approveErrorUSDC").textContent = error;
        console.log(error);
      }
    }
  });

  // purchaseWithTokens
  var bttn = document.getElementById("purchaseButton");
  cleanError("purchaseError");
  bttn.addEventListener("click", async function () {
    document.getElementById("purchaseError").textContent = "";
    var idInput = document.getElementById("purchaseInput").value;
    if(checkNetwork("g")){
    try {
      var allowanceDado = await bbitesTknContract.allowance(
        signer.address,
        pubSContractAdd
      );
      console.log(allowanceDado);
      var tx = await pubSContract.connect(signer).purchaseWithTokens(idInput);
      var res = await tx.wait();
      console.log(res.hash);
    } catch (error) {
      document.getElementById("purchaseError").textContent = error;
      console.log(error);
    }
  }
  });

  // purchaseWithUSDC
  var bttn = document.getElementById("purchaseButtonUSDC");
  cleanError("purchaseErrorUSDC");
  bttn.addEventListener("click", async function () {
    document.getElementById("purchaseErrorUSDC").textContent = "";
    var idInput = document.getElementById("purchaseInputUSDC").value;
    var amountIn = document.getElementById("amountInUSDCInput").value;
    if(checkNetwork("g")){
    try {
      var tx = await pubSContract
        .connect(signer)
        .purchaseWithUSDC(idInput, amountIn);
      var res = await tx.wait();
      console.log(res.hash);
    } catch (error) {
      document.getElementById("purchaseErrorUSDC").textContent = error;
      console.log(error);
    }
  }
  });

  // purchaseWithEtherAndId
  var bttn = document.getElementById("purchaseButtonEtherId");
  cleanError("purchaseEtherIdError");
  bttn.addEventListener("click", async function () {
    document.getElementById("purchaseEtherIdError").textContent = "";
    var idInput = document.getElementById("purchaseInputEtherId").value;
    if(checkNetwork("g")){
    try {
      var tx = await pubSContract
        .connect(signer)
        .purchaseWithEtherAndId(idInput, { value: ethers.parseEther("0.001") });
      var res = await tx.wait();
      console.log(res.hash);
    } catch (error) {
      document.getElementById("purchaseEtherIdError").textContent = error;
      console.log(error);
    }
  }
  });

  // send Ether
  var bttn = document.getElementById("sendEtherButton");
  cleanError("sendEtherError");
  bttn.addEventListener("click", async function () {
    document.getElementById("sendEtherError").textContent = "";
    if(checkNetwork("g")){
    try {
      var res = await signer.sendTransaction({
        to: pubSContractAdd,
        value: ethers.parseEther("0.001"),
      });

      console.log(res.hash);
    } catch (error) {
      document.getElementById("sendEtherError").textContent = error;
      console.log(error);
    }
  }
  });

  // getPriceForId
  var bttn = document.getElementById("getPriceNftByIdBttn");
  cleanError("getPriceNftError");
  
  bttn.addEventListener("click", async function () {
    document.getElementById("getPriceNftError").textContent = "";
    var _id = document.getElementById("priceNftIdInput").value;
    
    if(checkNetwork("g")){
    try {
      var tx = await pubSContract.getPriceForId(_id);

      console.log(tx);
      document.getElementById("priceNftByIdText").textContent =
        ethers.formatUnits(tx, 18);
    } catch (error) {
      document.getElementById("getPriceNftError").textContent = error;
    }
  }
  });

  // getProofs
  var bttn = document.getElementById("getProofsButtonId");
  bttn.addEventListener("click", async () => {
    var id = document.getElementById("inputIdProofId").value;
    var address = document.getElementById("inputAccountProofId").value;

    var proofs = construyendoPruebas(id, address);
    console.log(proofs);
    document.getElementById("showProofsTextId").textContent = proofs;
    navigator.clipboard.writeText(JSON.stringify(proofs));
  });

  // safeMintWhiteList
  var bttn = document.getElementById("safeMintWhiteListBttnId");
  cleanError("whiteListErrorId");
  bttn.addEventListener("click", async () => {
    document.getElementById("whiteListErrorId").textContent = "";
    if(checkNetwork("m")){
    try {
      // usar ethers.hexlify porque es un array de bytes
      var proofs = document.getElementById("whiteListToInputProofsId").value;
      proofs = JSON.parse(proofs).map(ethers.hexlify);
      var to = document.getElementById("whiteListToInputId").value;
      var token = document.getElementById("whiteListToInputTokenId").value;

      var tx = await nftContract
        .connect(signer)
        .safeMintWhiteList(to, token, proofs);
      var res = await tx.wait();
      console.log(res.hash);
    } catch (error) {
      document.getElementById("whiteListErrorId").textContent = error;
      console.log(error);
    }
  }
  });

  // buyBack
  var bttn = document.getElementById("buyBackBttn");
  cleanError("buyBackErrorId");
  bttn.addEventListener("click", async () => {
    if(checkNetwork("m")){
    document.getElementById("buyBackErrorId").textContent = "";
    try {
      // usar ethers.hexlify porque es un array de bytes
      var id = document.getElementById("buyBackInputId").value;
      var tx = await nftContract.connect(signer).buyBack(id);
      var res = await tx.wait();
      console.log(res.hash);
    } catch (error) {
      document.getElementById("buyBackErrorId").textContent = error;
      console.log(error);
    }
  }
  });
}

function initSCsGoerli() {
  provider = new ethers.BrowserProvider(window.ethereum);

  usdcAddress = "0x42b2cd695bb9aD2E2e1b88A1b5730397FF3e182D";
  bbitesTknAdd = "0x820C1a94A623Fb12B7ae32baE7906c0C64699C7C";
  pubSContractAdd = "0x31F447A94AaDfB931080A9D80eDBa3b8cc2e0B7c";

  usdcTkContract = new Contract(usdcAddress, usdcTknAbi.abi, provider);
  bbitesTknContract = new Contract(bbitesTknAdd, bbitesTokenAbi.abi, provider);
  pubSContract = new Contract(pubSContractAdd, publicSaleAbi.abi, provider);
}

function initSCsMumbai() {
  provider = new ethers.BrowserProvider(window.ethereum);

  var nftAddress = "0xA77a6c9D897DA6cf831B705E5aA7f228FB5BF4E3";

  nftContract = new Contract(nftAddress, nftTknAbi.abi, provider);
}

function setUpEventsContracts() {
  var pubSList = document.getElementById("pubSList");
  // pubSContract - "PurchaseNftWithId"
  pubSContract.on("PurchaseNftWithId", (account, id) => {
    var text = pubSList.textContent;
    pubSList.textContent = `${text} \n El evento purchase fue ejecutado por ${account} para el id ${id}`;
  });

  var bbitesListEl = document.getElementById("bbitesTList");
  // bbitesCListener - "Transfer"
  bbitesTknContract.on("Tranfer", (from, to, amount) => {
    var text = bbitesListEl.textContent;
    bbitesListEl.textContent = `${text} \n Se han tranferido ${ethers.parseEther(
      amount
    )} BBites Tokens desde ${from} hacia ${to} `;
  });

  var nftList = document.getElementById("nftList");
  // nftCListener - "Transfer"
  nftContract.on("Tranfer", (from, to, tokenId) => {
    var text = nftList.textContent;
    nftList.textContent = `${text} \n Se ha tranferido el token ${tokenId} desde ${from} a ${to} `;
  });

  var burnList = document.getElementById("burnList");
  // nftCListener - "Burn"
  nftContract.on("Burn", (account, id) => {
    var text = burnList.textContent;
    burnList.textContent = `${text} \n La cuenta ${account} ha quemado el token ${id}`;
  });
}

async function setUp() {
  window.ethereum.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  initSCsGoerli();

  initSCsMumbai();

  setUpListeners();

  setUpEventsContracts();

  buildMerkleTree();

  setUpMetamask();
}

function cleanError(divId) {
  var errorDiv = document.getElementById(divId);
  errorDiv.addEventListener("click", async () => {
    document.getElementById(divId).textContent = "";
  });
}

function checkNetwork(name) {
  if (name == "g" && chainId == 0x5) {
    return true;
  } else if (name == "m" && chainId == 0x13881) {
    return true;
  } else {
    alert("Red incorrecta");
    return false;
  }
}

setUp()
  .then()
  .catch((e) => console.log(e));
