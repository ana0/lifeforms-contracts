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
  return deployer.deploy(Lifeforms, 'Lifeforms', 'LIFE', 3600, web3.utils.toWei('10'), { from: accounts[0] })
    .then(async (lifeforms) => {
      await lifeforms.setBaseURI('https://isthisa.computer/api/lifeforms/');
      await lifeforms.setContractURI('https://isthisa.computer/ipfs/QmXquYVrt7pvJ6yAZq4BtKnbjwoagpfbpwn6MMeCYnq8JM/off-contract.json');
      await lifeforms.setIsOpen(true);
      await lifeforms.birth(accounts[0], 1, { from: accounts[0], value: web3.utils.toWei('10') });
    });
};
