// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {Ibalance, IUniSwapV2Router02, IBBitesToken, IUSDCoin} from "./Interfaces.sol";



contract PublicSale is
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC20PermitUpgradeable,
    UUPSUpgradeable
{
    // se hardcodea la dirección del router
    address routerAddress;
    address usdcAddress;
    address tokenAddress;
    
 
    Ibalance balance;

    // Crea una instancia de los dos contratos
    IBBitesToken bbtoken;
    IUSDCoin usdc;
    IUniSwapV2Router02 router;
     

    // Decimales
    uint256 public decimales;
    // Conteo de los NFT minteados con Ether
    uint256 EthMintedCounter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _token,
        address _usdc,
        address uniRouter
    ) public initializer {
        __ERC20_init("PublicSale", "PUBLIC");
        __Pausable_init();
        __AccessControl_init();
        __ERC20Permit_init("PublicSale");
        __UUPSUpgradeable_init();

        // Relaciona con los contratos
        bbtoken = IBBitesToken(_token);
        usdc = IUSDCoin(_usdc);

        usdcAddress = _usdc;
        tokenAddress = _token;

        EthMintedCounter = 0;

        // 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
        routerAddress = uniRouter;
        router = IUniSwapV2Router02(routerAddress);
              
        decimales = 10 ** 18;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); // Hay que quitarle al admin la posibilidad de mintear?

        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90000 * 10 ** 18;

    // Mantiene contabilidad de los NFTs minteados
    mapping(uint256 => bool) private mintedNFTs; 
    

    event PurchaseNftWithId(address account, uint256 id);

    function purchaseWithTokens(uint256 _id) public {
        // chequear que el id este dentro del rango necesario
        require(
            _id >= 0 && _id <= 699,
            "El id no esta dentro del rango posible"
        );

        // chequear si el id no fue minteado
        require(mintedNFTs[_id] == false, "El id ya fue asignado");

        // obterner el precio del NFT[id]
        uint256 tokenPrice = getPriceForId(_id);
        address user = msg.sender;

        // PARA PROBAR HACER MANUAL EL APPROVE
        // el msg.sender le da approve al contrato para luego retirar sus tokens
        // Se chequea el allowance
        uint256 responseApproval = bbtoken.allowance(msg.sender, address(this));
        require(responseApproval >= tokenPrice, "Allowance incorrecto");

        // se transfiere el dinero desde el usuario a al contrato
        bool responseTransfer = bbtoken.transferFrom(
            user,
            address(this),
            tokenPrice
        );
        require(responseTransfer, "La transaccion no se pudo realizar");

        // se agrega el id del token a la lista de NFTs minteados
        mintedNFTs[_id] = true;

        // se emite el evento
        emit PurchaseNftWithId(msg.sender, _id);
    }

       function purchaseWithUSDC(uint256 _id, uint256 _amountIn) external {
        // chequear que el id este dentro del rango necesario
        require(
            _id >= 0 && _id <= 699,
            "El id no esta dentro del rango posible"
        );

        // chequear si el id no fue minteado
        require(mintedNFTs[_id] == false, "El id ya fue asignado");

        address user = msg.sender;

        // requiere que el allowance sea mayor a lo enviado
        uint256 allowed = usdc.allowance(user, address(this));
        require(
            allowed >= _amountIn,
            "Debe aprobar previamente la cantidad de USDC necesaria."
        );

        // obterner el precio del NFT[id]
        uint256 tokenPrice = getPriceForId(_id);

        // se llama a usdc.transferFrom(). El contrato es SPENDER y RECEIVER (tiene previo allowance desde el front)
        require(
            usdc.transferFrom(user, address(this), _amountIn),
            "Falla el transfer from inicial"
        );

        // el contrato da approve al router
        usdc.approve(routerAddress, _amountIn);

        // llama a _swapTokensForExactTokens: valor de retorno de este metodo es cuanto gastaste del token input
        address[] memory path = new address[](2);
        path[0] = usdcAddress;
        path[1] = tokenAddress;

        uint256 _swapOut = tokenPrice;
      
        uint256[] memory _swapIn = _getAmountIn(
            tokenPrice,
            path
        );

        // path [token a entregar, token a recibir]
        uint256[] memory valorRetorno = router.swapTokensForExactTokens(
            _swapOut,
            _swapIn[0],
            path,
            address(this),
            block.timestamp + 3600
        );

        // transfiere el excedente de USDC a msg.sender
        bool resVuelto = usdc.transfer(user, _amountIn - valorRetorno[0]);
        require(resVuelto, "Fallo la devolucion de USDC");

        // se agrega el id del token a la lista de NFTs minteados
        mintedNFTs[_id] = true;

        emit PurchaseNftWithId(user, _id);
    }

    function purchaseWithEtherAndId(uint256 _id) public payable {
        require(msg.value >= 0.001 ether, "El ether enviado no es suficiente");

        if (msg.value > 0.001 ether) {
            uint256 vuelto = msg.value - 0.001 ether;
            payable(msg.sender).transfer(vuelto);
        }

        require(_purchaseWithEtherAndId(_id), "La transaccion fallo");
    }


    function depositEthForARandomNft() public payable {
       
        require(EthMintedCounter < 300, "Todos los nft han sido asignados");
        uint256 _id;
        
        bool check = true;


        while (check) {
            _id = _getRadomNumber();
            check = mintedNFTs[_id];
        }

        require(_purchaseWithEtherAndId(_id), "La transaccion fallo");
        EthMintedCounter++;
    }

    receive() external payable {
        require(msg.value == 0.001 ether, "El ether enviado no es correcto");
        depositEthForARandomNft();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getPriceForId(uint256 id) public view returns (uint256) {
        if (id >= 0 && id < 200) {
            return 1000 * decimales;
        }
        if (id > 199 && id < 500) {
            return id * 20 * decimales;
        }
        if (id > 499 && id < 700) {
            uint256 daysPassed = (block.timestamp - startDate) / 1 days;
            uint256 tempPrice = 10000 * decimales + 2000 * daysPassed * decimales;
            if (tempPrice > MAX_PRICE_NFT) {
                return MAX_PRICE_NFT;
            } else {
                return tempPrice;
            }
        }
    }

    function _swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] memory path, // [token a entregar, token a recibir]
        address to,
        uint deadline
    ) public returns (uint256[] memory) {
        address origenToken = path[0];
        ERC20Upgradeable(origenToken).approve(routerAddress, amountInMax + 10);

        uint256[] memory _amounts = router.swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );

        return _amounts;
    }


    function _getAmountIn(
        uint256 amountOut,
        address[] memory path
    ) public view returns (uint256[] memory) {
        uint256[] memory _amounts = router.getAmountsIn(amountOut, path);
        return _amounts;
    }

    function _getRadomNumber() internal view returns (uint256) {
        uint256 random = 0;
        uint nonce  = 1;
        while (random < 700 || random > 999) {
             random = (uint256(
                keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))
            ) % 1000);
            nonce++;
        }

        return random;
    }

    function _purchaseWithEtherAndId(uint256 _id) private returns (bool) {
        // chequear que el id este dentro del rango necesario
        require(
            _id >= 700 && _id <= 999,
            "El id no esta dentro del rango posible"
        );

        // chequear si el id no fue minteado
        require(mintedNFTs[_id] == false, "El id ya fue asignado");

        // se agrega el id del token a la lista de NFTs minteados
        mintedNFTs[_id] = true;

        emit PurchaseNftWithId(msg.sender, _id);

        return true;
    }
}
