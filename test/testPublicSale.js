var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers, upgrades } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");
// uniswap core

const factoryArtifact = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const pairArtifact = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const WETH9 = require("../WETH9.json");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

describe("Testing", function () {
  async function deployFixture() {
    const [owner, alice] = await ethers.getSigners();

    //uniswap
    var Factory = new ethers.ContractFactory(
      factoryArtifact.abi,
      factoryArtifact.bytecode,
      owner
    );
    var factory = await Factory.deploy(owner.address);

    const Token = await ethers.getContractFactory("BBitesToken");
    const token = await hre.upgrades.deployProxy(Token, { kind: "uups" });

    tokenAdd = await token.getAddress();

    const Usdc = await ethers.getContractFactory("USDCoin");
    const usdc = await Usdc.deploy();

    usdcAdd = await usdc.getAddress();

    // uniswap
    var Weth = new ethers.ContractFactory(WETH9.abi, WETH9.bytecode, owner);
    var weth = await Weth.deploy();
    await factory.createPair(token.target, usdc.target);
    var pairAddress = await factory.getPair(token.target, usdc.target);
    var pair = new ethers.Contract(pairAddress, pairArtifact.abi, owner);
    var Router = new ethers.ContractFactory(
      routerArtifact.abi,
      routerArtifact.bytecode,
      owner
    );
    var router = await Router.deploy(factory.target, weth.target);

    var routerAdd = await router.getAddress();

    await token.approve(router, token.balanceOf(owner));
    await usdc.approve(router, usdc.balanceOf(owner));
    await router.addLiquidity(
      token.target,
      usdc.target,
      token.balanceOf(owner),
      usdc.balanceOf(owner),
      0,
      0,
      owner,
      Math.floor(Date.now() / 1000 + 10 * 60)
    );

    const Contrato = await ethers.getContractFactory("PublicSale");
    const contrato = await upgrades.deployProxy(
      Contrato,
      [token.target, usdc.target, router.target],
      { initializer: 'initialize', kind: "uups" }
    );

    var contratoAdd = contrato.getAddress();

    return {
      contrato,
      owner,
      alice,
      token,
      contratoAdd,
      usdc,
      pair,
      routerAdd,
    };
  }

  var pEth = ethers.parseEther;
  var TOKENS = pEth("1000");

  describe("Purchase with Tokens", () => {
    it("Acuña tokens en la cuenta Alice", async function () {
      var { alice, token } = await loadFixture(deployFixture);
      await token.mint(alice.address, TOKENS);
      var balanceAlice = await token.balanceOf(alice.address);
      expect(balanceAlice).to.be.equal(
        TOKENS,
        "No se hizo el mint correctamente"
      );
    });

    // da el approve
    it("Da el approve", async function () {
      var { alice, token, contratoAdd } = await loadFixture(deployFixture);
      await token.connect(alice).approve(contratoAdd, TOKENS);

      var allowance = await token.allowance(alice.address, contratoAdd);
      expect(allowance).to.be.equal(
        TOKENS,
        "No se hizo el allowance correctamente"
      );
    });

    it("Intenta comprar un ID que no esta a la venta", async function () {
      var { contrato, alice } = await loadFixture(deployFixture);
      await expect(
        contrato.connect(alice).purchaseWithTokens(1210)
      ).to.be.revertedWith("El id no esta dentro del rango posible");
    });

    it("Compra el token correctamente", async function () {
      var { contrato, alice, token, contratoAdd } = await loadFixture(
        deployFixture
      );

      await token.mint(alice.address, TOKENS);
      await token.connect(alice).approve(contratoAdd, TOKENS);
      var tx = await contrato.connect(alice).purchaseWithTokens(2);
      expect(tx).to.emit(contrato, "PurchaseNftWithId");
    });
  });

 
  describe("Purchase with USDC", () => {
    
    
    var usdcAmount = 10000000000;

    it("Intenta comprar un ID que no esta a la venta", async function () {
      var { contrato, alice } = await loadFixture(deployFixture);
      await expect(
        contrato.connect(alice).purchaseWithTokens(1210)
      ).to.be.revertedWith("El id no esta dentro del rango posible");
    });

    it("Acuña usdc en la cuenta Alice", async function () {
      var { alice, usdc } = await loadFixture(deployFixture);
      // acuña 10.000 usdc
      await usdc.mint(alice.address, usdcAmount);
      var balanceAlice = await usdc.balanceOf(alice.address);
      expect(balanceAlice).to.be.equal(
        usdcAmount,
        "No se hizo el mint correctamente"
      );
    });

    it("Da el approve", async function () {
      var { alice, contratoAdd, usdc } = await loadFixture(deployFixture);
      await usdc.connect(alice).approve(contratoAdd, usdcAmount);

      var allowance = await usdc.allowance(alice.address, contratoAdd);
      expect(allowance).to.be.equal(
        usdcAmount,
        "No se hizo el allowance correctamente"
      );
    });

    it("Compra el token correctamente", async function () {
      var {
        contrato,
        alice,
        usdc,
        contratoAdd,
        pair,
        token,
        routerAdd,
        owner,
      } = await loadFixture(deployFixture);

      // aprueba al router

      // Simula obtención de precio en dólares

      var precioEnUSDC = 275653000000;

      await usdc.mint(alice.address, precioEnUSDC);

      await usdc.connect(alice).approve(contrato.target, precioEnUSDC);
      
      console.log("saldo Alice en USDC: ", await usdc.balanceOf(alice));
      console.log("saldo Contract en BBites: ", await token.balanceOf(contratoAdd));
      console.log("Allowance del contrato en USDC: ", await usdc.allowance(alice.address, contratoAdd));
 
      var tx = await contrato.connect(alice).purchaseWithUSDC(3,precioEnUSDC);
      await expect(tx).to.emit(contrato, "PurchaseNftWithId").withArgs(alice.address, 3);

      console.log("saldo Alice en USDC: ", await usdc.balanceOf(alice));
      console.log("saldo Contract en Bbites: ", await token.balanceOf(contratoAdd));
      console.log("saldo Contract en USDC: ", await usdc.balanceOf(await contrato.getAddress()));

    });
  });


  describe("Purchase with Ether and id", () => {

    it("Comprando con cantidad incorrecta de Ethers", async function () {
      var { contrato, alice, token, contratoAdd } = await loadFixture(
        deployFixture
      );
     
      var tx = contrato.connect(alice).purchaseWithEtherAndId(710, { value: ethers.parseEther("0.0001")});
      await expect(tx).to.be.revertedWith("El ether enviado no es suficiente");
    });

    it("Comprando con Id fuera de rango", async function () {
      var { contrato, alice, token, contratoAdd } = await loadFixture(
        deployFixture
      );
     
      var tx = contrato.connect(alice).purchaseWithEtherAndId(1100, { value: ethers.parseEther("0.001")});
      await expect(tx).to.be.revertedWith("El id no esta dentro del rango posible");
    });

    it("Comprando con ID y cantidad correcta de Ethers", async function () {
      var { contrato, alice, token, contratoAdd } = await loadFixture(
        deployFixture
      );
     
      var tx = await contrato.connect(alice).purchaseWithEtherAndId(710, { value: ethers.parseEther("0.001")});
      await expect(tx).to.emit(contrato, "PurchaseNftWithId").withArgs(alice.address, 710);
    });
  });

  describe("Purchase with Ether and no Id", () => {

    it("Comprando con cantidad incorrecta de Ethers", async function () {
      var { contrato, alice, contratoAdd} = await loadFixture(
        deployFixture
      );
     
      var tx = alice.sendTransaction({
        to: contratoAdd,
        value: ethers.parseEther("0.0001"),
      });
      await expect(tx).to.be.revertedWith("El ether enviado no es correcto");
    });

    it("Comprando con cantidad correcta de Ethers", async function () {
      var { contrato, alice, contratoAdd} = await loadFixture(
        deployFixture
      );
     
      var tx = alice.sendTransaction({
        to: contratoAdd,
        value: ethers.parseEther("0.001"),
      });
      

      await expect(tx).to.emit(contrato, "PurchaseNftWithId");


    });



  })
 
});
