const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { ethers } = require("hardhat");
const {construyendoPruebas} = require("./merkleTree");

var tokenId = 1997;
var account = "0x792d53836691F665fD2Be9dEB3Fb2214c2A282a3";

console.log(construyendoPruebas(tokenId, account));