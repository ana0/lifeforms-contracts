const truffleContract = require('@truffle/contract');

const Lifeforms = artifacts.require('Lifeforms2');
const EnumerableSetArtifacts = require('@openzeppelin/contracts/build/contracts/EnumerableSet.json');
const EnumerableMapArtifacts = require('@openzeppelin/contracts/build/contracts/EnumerableMap.json');

const EnumerableSet = truffleContract(EnumerableSetArtifacts);
EnumerableSet.setProvider(web3.currentProvider);
const EnumerableMap = truffleContract(EnumerableMapArtifacts);
EnumerableMap.setProvider(web3.currentProvider);

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(EnumerableSet, { from: accounts[0] });
  await deployer.deploy(EnumerableMap, { from: accounts[0] });
  await deployer.link(EnumerableSet, Lifeforms);
  await deployer.link(EnumerableMap, Lifeforms);
  return deployer.deploy(Lifeforms, 'Lifeforms', 'LIFE', 600, web3.utils.toWei('10'), { from: accounts[0] })
    .then(async (lifeforms) => {
      await lifeforms.setBaseURI('https://isthisa.computer/api/lifeforms/');
      await lifeforms.setContractURI('https://isthisa.computer/ipfs/QmVDJwDuRv9PsRvPGxqengVCPawCVXdmdda74wEbGFC1ZQ/lifeforms-contract.json');
      await lifeforms.setIsOpen(false);
      await lifeforms.ownerBirth(accounts[0], 1, { from: accounts[0] });
      await lifeforms.ownerBirth(accounts[0], 2, { from: accounts[0] });
      await lifeforms.ownerBirth(accounts[0], 3, { from: accounts[0] });
      await lifeforms.setGravedigger("0x537D5C6580bC475937a9a475f1CF45ab1c49fB74", { from: accounts[0] });
    });
};
