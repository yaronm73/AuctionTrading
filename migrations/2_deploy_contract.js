const AuctionTrading = artifacts.require("AuctionTrading");

module.exports = function(deployer) {
  deployer.deploy(AuctionTrading);
};
