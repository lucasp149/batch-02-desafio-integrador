// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract CuyCollectionNft is
    Initializable,
    ERC721Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC721BurnableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // evento Burn para la quema de tokens(interna) y el posterior envío de BBTKN al quemador
    event Burn(address account, uint256 id);

    // Se crea la root (merkle tree)
    bytes32 public root;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(bytes32 raiz) public initializer {
        __ERC721_init("Cuy Collection Nft", "CCNFT");
        __ERC721Burnable_init();
        __Pausable_init();
        __AccessControl_init();

        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        root = raiz;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmUWD6MAtDao8CuvThzbQtVAZNprMeMRVV8uH81WsAJwRK/";
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(
            tokenId >= 0 && tokenId < 1000,
            "El token Id no esta autorizado"
        );
        _safeMint(to, tokenId);
    }

    function buyBack(uint256 id) public {
        require(id > 999 && id < 2000, "El token no pertenece a la White List");

        address ownerOf = ERC721Upgradeable.ownerOf(id);

        burn(id);

        emit Burn(ownerOf, id);
    }

    function safeMintWhiteList(
        address to,
        uint256 tokenId,
        bytes32[] memory proofs
    ) public whenNotPaused {
        require(
            tokenId >= 1000 && tokenId < 2000,
            "El token Id no esta autorizado"
        );
        require(
            verify(_hashearInfo(to, tokenId), proofs),
            "No eres parte de la lista"
        );

        _safeMint(to, tokenId);
    }

    function saludar() public pure returns (uint256) {
        return 1001;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    // Merkle functions.

    function _hashearInfo(
        address to,
        uint256 tokenId
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenId, to));
    }

    function verify(
        bytes32 leaf,
        bytes32[] memory proofs
    ) public view returns (bool) {
        return MerkleProof.verify(proofs, root, leaf);
    }

    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] memory proofs
    ) public view returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i; i < proofs.length; i++) {
            bytes32 proof = proofs[i];

            if (computedHash < proof) {
                computedHash = keccak256(abi.encodePacked(computedHash, proof));
            } else {
                computedHash = keccak256(abi.encodePacked(proof, computedHash));
            }
        }
        return computedHash == root;
    }

    /*
    function _grantMinterRole(
        address account
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(keccak256("MINTER_ROLE"), account);
    }

    function actualizarRaiz(bytes32 _root) public {
        root = _root;
    }
*/

    // The following functions are overrides required by Solidity.

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
