const StarContract = artifacts.require("StarContract")

module.exports = function (deployer) {
    deployer.deploy(StarContract)
}