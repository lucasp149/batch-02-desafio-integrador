var { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
var { expect } = require("chai");
var { ethers, upgrades } = require("hardhat");
var { time } = require("@nomicfoundation/hardhat-network-helpers");

const { getRole, deploySC, deploySCNoUp, ex, pEth } = require("../utils");

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

// 00 horas del 30 de septiembre del 2023 GMT
var startDate = 1696032000;

describe("Testing", function () {
  async function deployFixture() {
    const [owner, alice] = await ethers.getSigners();

    const Contrato = await ethers.getContractFactory("BBitesToken");
    const contrato = await hre.upgrades.deployProxy(Contrato, { kind: "uups" });

    return { contrato, owner, alice };
  }

  describe("BBTKN", function () {
    var pEth = ethers.parseEther;
    var TOKENS = pEth("100");

    it("Approve", async function () {
      var { contrato, owner, alice } = await loadFixture(deployFixture);

      await contrato.approve(alice.address, TOKENS);
      var allowance = await contrato.allowance(owner.address, alice.address);
      expect(allowance).to.be.equal(
        TOKENS,
        "No se hizo el allowance correctamente"
      );
    });

    it("Transfer From", async function () {
      var { contrato, owner, alice } = await loadFixture(deployFixture);

      await contrato.approve(alice.address, TOKENS);

      await contrato
        .connect(alice)
        .transferFrom(owner.address, alice.address, TOKENS);

      var balanceAlice = await contrato.balanceOf(alice.address);
      expect(balanceAlice).to.be.equal(TOKENS);
    });
  });
});
