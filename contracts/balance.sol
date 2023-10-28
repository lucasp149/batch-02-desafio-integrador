// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';


interface IRC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract balance {
    address usdcAddress = 0x42b2cd695bb9aD2E2e1b88A1b5730397FF3e182D; 
    address bbitesTknAdd = 0x820C1a94A623Fb12B7ae32baE7906c0C64699C7C;
    address factoryAdd = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

    IUniswapV2Factory factory= IUniswapV2Factory(factoryAdd);
    IRC20 token = IRC20(bbitesTknAdd);
    IRC20 usdc = IRC20(usdcAddress);

    function getPair() public view returns(address) {
        return factory.getPair(usdcAddress, bbitesTknAdd);
    }

    function getUsdcBalance() public view returns(uint256)  {
        return usdc.balanceOf(getPair());
    }

    function getTokenBalance() public view returns(uint256)  {
        return token.balanceOf(getPair());
    }

}