const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const walletAndIds = require("../wallets/walletList");

var merkleTree, root;
function hashToken(tokenId, account) {
  return Buffer.from(
    ethers
      .solidityPackedKeccak256(["uint256", "address"], [tokenId, account])
      .slice(2),
    "hex"
  );
}

function getRootFromMT(lista) {

  var elementosHasheados = lista.map(({ id, address }) => {
    return hashToken(id, address);
  });
  merkleTree = new MerkleTree(elementosHasheados, keccak256, {
    sortPairs: true,
  });

  root = merkleTree.getHexRoot();
  //console.log(root);

  return root;
}

function getMerkleFromMT() {

  var elementosHasheados = walletAndIds.map(({ id, address }) => {
    return hashToken(id, address);
  });
  merkleTree = new MerkleTree(elementosHasheados, keccak256, {
    sortPairs: true,
  });

  return merkleTree;
}

function getMerkleFromMTTest(lista) {

  var elementosHasheados = lista.map(({ id, address }) => {
    return hashToken(id, address);
  });
  merkleTree = new MerkleTree(elementosHasheados, keccak256, {
    sortPairs: true,
  });

  return merkleTree;
}

function construyendoPruebas(tokenId, account) {
  // var tokenId = 7;
  //var account = "0x00b7cda410001f6e52a7f19000b3f767ec8aec7d";
  merkleTree = getMerkleFromMT();
  //root = getRootFromMT(walletAndIds);
  var hasheandoElemento = hashToken(tokenId, account);

  pruebas = merkleTree.getHexProof(hasheandoElemento);
  //return pruebas;

  // verificacion off-chain
  //var pertenece = merkleTree.verify(pruebas, hasheandoElemento, root);
  //console.log("Pertenece:" + pertenece);
  console.log(pruebas);
  return pruebas;
}

function construyendoPruebasTest(tokenId, account, lista) {
  // var tokenId = 7;
  //var account = "0x00b7cda410001f6e52a7f19000b3f767ec8aec7d";
  merkleTree = getMerkleFromMTTest(lista);
  //root = getRootFromMT(walletAndIds);
  var hasheandoElemento = hashToken(tokenId, account);

  pruebas = merkleTree.getHexProof(hasheandoElemento);
  //return pruebas;

  // verificacion off-chain
  //var pertenece = merkleTree.verify(pruebas, hasheandoElemento, root);
  //console.log("Pertenece:" + pertenece);
  console.log(pruebas);
  return pruebas;
}

module.exports = { getRootFromMT, construyendoPruebas, getMerkleFromMT, getMerkleFromMTTest, construyendoPruebasTest };
