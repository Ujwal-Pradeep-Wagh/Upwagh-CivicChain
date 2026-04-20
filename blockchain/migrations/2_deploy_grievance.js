/**
 * Migration: Deploy Grievance.sol to Ganache
 *
 * Truffle runs migration files in order (1_, 2_, 3_...).
 * This file tells Truffle to deploy our Grievance contract.
 *
 * After this runs successfully, Truffle will print the contract address.
 * You will copy that address into backend/config/web3.js and frontend/src/utils/web3.js.
 */

// Tell Truffle which compiled contract to deploy
const Grievance = artifacts.require("Grievance");

module.exports = function (deployer) {
  // Deploy the Grievance contract with no constructor arguments
  deployer.deploy(Grievance);
};