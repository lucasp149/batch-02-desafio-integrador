const { ethers } = require("ethers");
const {
  DefenderRelaySigner,
  DefenderRelayProvider,
} = require("@openzeppelin/defender-relay-client/lib/ethers");

exports.handler = async function (data) {
  const payload = data.request.body.events;

  const provider = new DefenderRelayProvider(data);
  const signer = new DefenderRelaySigner(data, provider, { speed: "fast" });

  // agregados

    // Filtrando solo eventos
    var onlyEvents = payload[0].matchReasons.filter((e) => e.type === "event");
    if (onlyEvents.length === 0) return;
  
    // Filtrando solo MintInAnotherChain
    var event = onlyEvents.filter((ev) =>
      ev.signature.includes("Burn")
    );
    // Mismos params que en el evento
    var { account, tokens } = event[0].params;
  
    // Ejecutar 'mint' en Goerli del contrato BBTKN
    var bBiteToken = "0x2720ED465768323449Ba7eE944521A7fe454bF1c";
    var tokenAbi = ["function mint(address to, uint256 amount)"];
    var tokenContract = new ethers.Contract(bBiteToken, tokenAbi, signer);
    var tx = await tokenContract.mint(account, tokens);
    var res = await tx.wait();
    return res;

};
