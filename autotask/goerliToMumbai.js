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
  
    // Filtrando solo PurchaseNftWithId
    var event = onlyEvents.filter((ev) =>
      ev.signature.includes("PurchaseNftWithId")
    );
  
    // Mismos params que en el evento
    var { account, tokens } = event[0].params;
  
    // Ejecutar 'safeMint' en Mumbai del contrato Cuy Collection
    var cuyCollection = "0xee64F4694476D2A01b56E8AcD8E34d3187327791";
    var tokenAbi = ["function safeMint(address to, uint256 tokenId)"];
    var tokenContract = new ethers.Contract(cuyCollection, tokenAbi, signer);
    var tx = await tokenContract.safeMint(account, tokens);
    var res = await tx.wait();
  	
    return res;
};
