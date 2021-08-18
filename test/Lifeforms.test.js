const truffleContract = require('@truffle/contract');
const EnumerableSetArtifacts = require('@openzeppelin/contracts/build/contracts/EnumerableSet.json');
const EnumerableMapArtifacts = require('@openzeppelin/contracts/build/contracts/EnumerableMap.json');

const {
  BN,
} = require('./helpers/constants');
const {
  assertRevert,
} = require('./helpers/assertRevert');
const { getTimestampFromTx } = require('./helpers/getTimestamp');
const { increase } = require('./helpers/increaseTime');

const Lifeforms = artifacts.require('Lifeforms');

const bn = (number) => new BN(number);

const EnumerableSet = truffleContract(EnumerableSetArtifacts);
EnumerableSet.setProvider(web3.currentProvider);
const EnumerableMap = truffleContract(EnumerableMapArtifacts);
EnumerableMap.setProvider(web3.currentProvider);

require('chai')
  .use(require('chai-bn')(BN))
  .should();

contract('Lifeforms', ([_, systemOwner, attacker, owner, secondOwner]) => { // eslint-disable-line no-unused-vars
  let lifeforms = null;
  const tokenId = 1;
  const duration = 20;
  const price = 10;
  const name = 'Lifeforms';
  const symbol = 'LIFE';
  const baseUri = 'http://url.com/';

  beforeEach(async () => {
    const enumerableSet = await EnumerableSet.new({ from: systemOwner });
    const enumerableMap = await EnumerableSet.new({ from: systemOwner });
    await Lifeforms.link('EnumerableSet', enumerableSet.address);
    await Lifeforms.link('EnumerableMap', enumerableMap.address);
    lifeforms = await Lifeforms
      .new(
        name,
        symbol,
        duration,
        price,
        { from: systemOwner },
      );
  });

  it('owner can set baseUri', async () => {
    await lifeforms.setBaseURI(baseUri, { from: systemOwner });
    (await lifeforms.baseURI()).should.be.equal(baseUri);
  });

  it('attacker can not set baseUri', async () => {
    await assertRevert(lifeforms.setBaseURI(baseUri, { from: attacker }));
  });

  it('owner can set contractUri', async () => {
    await lifeforms.setContractURI(baseUri, { from: systemOwner });
    (await lifeforms.contractURI()).should.be.equal(baseUri);
  });

  it('attacker can not set contractUri', async () => {
    await assertRevert(lifeforms.setContractURI(baseUri, { from: attacker }));
  });

  it('should successfully birth a lifeform', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    (await lifeforms.isAlive(tokenId)).should.be.equal(true);
  });

  it('should set correct birthtime', async () => {
    const tx = await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    const birthtime = await getTimestampFromTx(tx.logs[0].transactionHash, web3);
    (await lifeforms.tokenBirth(tokenId)).should.be.bignumber.equal(bn(birthtime));
  });

  it('should set correct transfertime', async () => {
    const tx = await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    const birthtime = await getTimestampFromTx(tx.logs[0].transactionHash, web3);
    (await lifeforms.tokenOwnerBeginning(tokenId)).should.be.bignumber.equal(bn(birthtime));
  });

  it('should set correct transfertime after a transfer', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(10);
    const tx = await lifeforms.transferFrom(owner, secondOwner, tokenId, { from: owner });
    const transfertime = await getTimestampFromTx(tx.logs[0].transactionHash, web3);
    (await lifeforms.tokenOwnerBeginning(tokenId)).should.be.bignumber.equal(bn(transfertime));
  });

  it('should not set new transfertime after a transfer to yourself', async () => {
    const tx = await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(10);
    await lifeforms.transferFrom(owner, owner, tokenId, { from: owner });
    const birthtime = await getTimestampFromTx(tx.logs[0].transactionHash, web3);
    (await lifeforms.tokenOwnerBeginning(tokenId)).should.be.bignumber.equal(bn(birthtime));
  });

  it('should set correct transfertime after a safetransfer', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(10);
    const tx = await lifeforms.safeTransferFrom(owner, secondOwner, tokenId, { from: owner });
    const transfertime = await getTimestampFromTx(tx.logs[0].transactionHash, web3);
    (await lifeforms.tokenOwnerBeginning(tokenId)).should.be.bignumber.equal(bn(transfertime));
  });

  it('should not set new transfertime after a safetransfer to yourself', async () => {
    const tx = await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(10);
    await lifeforms.safeTransferFrom(owner, owner, tokenId, { from: owner });
    const birthtime = await getTimestampFromTx(tx.logs[0].transactionHash, web3);
    (await lifeforms.tokenOwnerBeginning(tokenId)).should.be.bignumber.equal(bn(birthtime));
  });

  it('user birthing token leaves eth in contract', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    (await web3.eth.getBalance(lifeforms.address)).should.be.bignumber.equal(bn(price));
  });
});
