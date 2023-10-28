var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers, upgrades } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");
var { getRootFromMT, construyendoPruebas, getMerkleFromMT, construyendoPruebasTest } = require("../utils/merkleTree");
const walletAndIds = require("../wallets/walletList");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

describe("Testing", function () {
  async function deployFixture() {
    const [owner, alice] = await ethers.getSigners();

    var root = getRootFromMT(walletAndIds);

    const Contrato = await ethers.getContractFactory("UpCuyCollectionNft");
    const contrato = await hre.upgrades.deployProxy(Contrato, [root], {
      kind: "uups",
    });

    return { contrato, owner, alice };
  }

  describe("Cuy Collection", function () {
    var pEth = ethers.parseEther;
    var TOKENS = pEth("100");

    describe("Safe Mint White List", () => {
      it("Minteando con usuario aprobado", async function () {
        var { contrato, owner, alice } = await loadFixture(deployFixture);

        var to = "0x792d53836691F665fD2Be9dEB3Fb2214c2A282a3";
        var tokenId = 1997;
        var proofs = construyendoPruebas(tokenId, to);

        await contrato.safeMintWhiteList(to, tokenId, proofs);

        var balanceMerkle = await contrato.balanceOf(
          "0x792d53836691F665fD2Be9dEB3Fb2214c2A282a3"
        );
        expect(balanceMerkle).to.be.equal(1);

        var balanceOwner = await contrato.balanceOf(owner.address);
        expect(balanceOwner).to.be.equal(0);
      });

      it("Minteando con usuario fuera de la white list", async function () {
        var { contrato, owner, alice } = await loadFixture(deployFixture);

        var to = "0xE3bDbf08AA555cc12770A5220d1769b337061CD6";
        var tokenId = 1997;
        var proofs = construyendoPruebas(tokenId, to);

        
        await expect(contrato.safeMintWhiteList(to, tokenId, proofs)).to.be.revertedWith("No eres parte de la lista");
           
      });
    });

    describe("Safe Mint", () => {
      it("Minteando un token correcto", async function () {
        var { contrato, owner, alice } = await loadFixture(deployFixture);

        var to = alice.address;
        var tokenId = 200;

        await contrato.safeMint(to, tokenId);

        var balanceMinted = await contrato.balanceOf(alice.address);
        expect(balanceMinted).to.be.equal(1);

        var balanceOwner = await contrato.balanceOf(owner.address);
        expect(balanceOwner).to.be.equal(0);
      });
      it("Minteando un token incorrecto", async function () {
        var { contrato, owner, alice } = await loadFixture(deployFixture);

        var to = alice.address;
        var tokenId = 1200;

        expect(contrato.safeMint(to, tokenId)).to.be.revertedWith(
          "El token Id no esta autorizado"
        );
      });

      it("Minteando un token ya existente", async function () {
        var { contrato, owner, alice } = await loadFixture(deployFixture);

        var to = alice.address;
        var tokenId = 200;

        await contrato.safeMint(to, tokenId);
        
       

       await expect(contrato.safeMint(to, tokenId)).to.be.revertedWith(
          "ERC721: token already minted"
        );
      });
    });

    describe("Buy Back", () => {
      it("Burning a white list token", async function () {
        var { contrato, owner, alice } = await loadFixture(deployFixture);

        var newJson = [
          { id: 1001, address: owner.address },
          { id: 1002, address: alice.address },
        ];

        var newRoot = getRootFromMT(newJson);
        await contrato.actualizarRaiz(newRoot);
        console.log("new root: " + newRoot);
        var to = alice.address;
        var tokenId = 1002;
        var proofs = await construyendoPruebasTest(tokenId, to, newJson);

        await contrato.safeMintWhiteList(to, tokenId, proofs);

        var balanceMerkle = await contrato.balanceOf(alice.address);

        expect(balanceMerkle).to.be.equal(1);

        

        var tx = await contrato.connect(alice).buyBack(tokenId);

        var balanceMerkle = await contrato.balanceOf(alice.address);

        expect(balanceMerkle).to.be.equal(0);

        await expect(tx).to.emit(contrato, "Burn").withArgs(alice.address,tokenId);

        var tx = contrato.safeMintWhiteList(to, tokenId, proofs);
        await expect(tx).to.be.revertedWith("El token ya fue minteado");
       
        
      });
/*
      it("Burning a incorrect white list token", async function () {
        var { contrato, owner, alice } = await loadFixture(deployFixture);

        var newJson = [
          { id: 1001, address: owner.address },
          { id: 1002, address: alice.address },
        ];

        var newRoot = getRootFromMT(newJson);
        await contrato.actualizarRaiz(newRoot);

        var to = alice.address;
        var tokenId = 1002;
        var proofs = construyendoPruebas(tokenId, to);

        await contrato.safeMintWhiteList(to, tokenId, proofs);

        var balanceMerkle = await contrato.balanceOf(alice.address);

        expect(balanceMerkle).to.be.equal(1);

        await expect(contrato.connect(alice).buyBack(1003)).to.be.revertedWith("ERC721: invalid token ID");
      });*/

    });
  });
});
