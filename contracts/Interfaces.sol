// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface Ibalance {
    function getPair() external view returns (address);

    function getUsdcBalance() external view returns (uint256);

    function getTokenBalance() external view returns (uint256);
}

interface IUniSwapV2Router02 {
    // Conozco la cantidad de tokens B que quiero obtener
    // No sé cuántos tokens A voy a pagar
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountIn(
        uint amountOut,
        uint256 reservesIn,
        uint256 reservesOut
    ) external view returns (uint256);

    function getAmountsIn(
        uint amountOut,
        address[] memory path
    ) external view returns (uint256[] memory amounts);
}

/*
// address: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f
interface IUniswapV2Factory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}
*/

interface IUSDCoin {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function approve(address to, uint256 amount) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function allowance(address from, address to) external returns (uint256);
}

interface IBBitesToken {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external returns (uint256);
}
