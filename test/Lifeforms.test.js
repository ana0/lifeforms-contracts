const truffleContract = require('@truffle/contract');
const EnumerableSetArtifacts = require('@openzeppelin/contracts/build/contracts/EnumerableSet.json');
const EnumerableMapArtifacts = require('@openzeppelin/contracts/build/contracts/EnumerableMap.json');
const {
  ZERO_ADDRESS,
  ZERO_HASH,
} = require('./helpers/constants');

const {
  BN,
} = require('./helpers/constants');
const {
  assertRevert,
} = require('./helpers/assertRevert');
const { getTimestampFromTx } = require('./helpers/getTimestamp');
const { increase } = require('./helpers/increaseTime');

const Lifeforms = artifacts.require('Lifeforms2');

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
    // const enumerableSet = await EnumerableSet.new({ from: systemOwner });
    // const enumerableMap = await EnumerableSet.new({ from: systemOwner });
    // await Lifeforms.link('EnumerableSet', enumerableSet.address);
    // await Lifeforms.link('EnumerableMap', enumerableMap.address);
    lifeforms = await Lifeforms
      .new(
        name,
        symbol,
        duration,
        price,
        { from: systemOwner },
      );
    await lifeforms.setBaseURI(baseUri, { from: systemOwner });
    await lifeforms.setIsOpen(true, { from: systemOwner });
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

  it('dead lifeform should not be alive', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    (await lifeforms.isAlive(tokenId)).should.be.equal(false);
  });

  it('dead lifeform should be dead', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    (await lifeforms.isDead(tokenId)).should.be.equal(true);
  });

  it('unborn lifeform should not be alive', async () => {
    (await lifeforms.isAlive(4)).should.be.equal(false);
  });

  it('unborn lifeform should not be dead', async () => {
    (await lifeforms.isDead(4)).should.be.equal(false);
  });

  it('should return correct owner of birthed lifeform', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    (await lifeforms.ownerOf(tokenId)).should.be.equal(owner);
  });

  it('should set correct tokenURI', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    (await lifeforms.tokenURI(tokenId)).should.be.equal(`${baseUri}1`);
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

  it('should not set new transfertime after death with transfer', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    await lifeforms.transferFrom(owner, owner, tokenId, { from: owner });
    (await lifeforms.tokenOwnerBeginning(tokenId)).should.be.bignumber.equal(bn(0));
  });

  it('should not set new transfertime after death with safeTransfer', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    await lifeforms.safeTransferFrom(owner, owner, tokenId, { from: owner });
    (await lifeforms.tokenOwnerBeginning(tokenId)).should.be.bignumber.equal(bn(0));
  });

  it('should not return birthtime after death with transfer', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    await lifeforms.transferFrom(owner, owner, tokenId, { from: owner });
    (await lifeforms.tokenBirth(tokenId)).should.be.bignumber.equal(bn(0));
  });

  it('should not return birthtime after death with safeTransfer', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    await lifeforms.safeTransferFrom(owner, owner, tokenId, { from: owner });
    (await lifeforms.tokenBirth(tokenId)).should.be.bignumber.equal(bn(0));
  });

  it('can not transfer after death', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    await lifeforms.transferFrom(owner, secondOwner, tokenId, { from: owner });
    (await lifeforms.ownerOf(tokenId)).should.be.equal(ZERO_ADDRESS);
  });

  it('can not safeTransfer after death', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    await lifeforms.safeTransferFrom(owner, secondOwner, tokenId, { from: owner });
    (await lifeforms.ownerOf(tokenId)).should.be.equal(ZERO_ADDRESS);
  });

  it('user birthing token leaves eth in contract', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    (await web3.eth.getBalance(lifeforms.address)).should.be.bignumber.equal(bn(price));
  });

  it('should return full lifeform information when alive', async () => {
    await lifeforms.setBaseURI(baseUri, { from: systemOwner });
    const tx = await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    const transfertime = await getTimestampFromTx(tx.logs[0].transactionHash, web3);
    const lifeform = await lifeforms.getLifeform(tokenId);
    lifeform[0].should.be.equal('http://url.com/1');
    lifeform[1].should.be.equal(owner);
    lifeform[2].should.be.bignumber.equal(bn(transfertime));
    lifeform[3].should.be.bignumber.equal(bn(transfertime));
    lifeform[4].should.not.be.equal(ZERO_HASH);
  });

  it('should not return lifeform information after death', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    const lifeform = await lifeforms.getLifeform(tokenId);
    lifeform[0].should.be.equal('');
    lifeform[1].should.be.equal(ZERO_ADDRESS);
    lifeform[2].should.be.bignumber.equal(bn(0));
    lifeform[3].should.be.bignumber.equal(bn(0));
    lifeform[4].should.be.equal(ZERO_HASH);
  });

  it('should return correct balanceOf when alive', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    (await lifeforms.balanceOf(owner)).should.be.bignumber.equal(bn(1));
  });

  it('should return correct balanceOf after death', async () => {
    await lifeforms.birth(owner, tokenId, { from: owner, value: price });
    await increase(21);
    (await lifeforms.balanceOf(owner)).should.be.bignumber.equal(bn(0));
  });

  it('attacker cannot birth when not open', async () => {
    await lifeforms.setIsOpen(false, { from: systemOwner });
    assertRevert(lifeforms.birth(attacker, tokenId, { from: attacker, value: price }));
  });

  it('attacker cannot set open', async () => {
    await lifeforms.setIsOpen(false, { from: systemOwner });
    assertRevert(lifeforms.setIsOpen(true, { from: attacker }));
  });

  it('systemOwner can always birth', async () => {
    await lifeforms.setIsOpen(false, { from: systemOwner });
    await lifeforms.ownerBirth(systemOwner, tokenId, { from: systemOwner });
    (await lifeforms.balanceOf(systemOwner)).should.be.bignumber.equal(bn(1));
  });

  // it('should return correct tokenOfOwnerByIndex when alive', async () => {
  //   await lifeforms.birth(owner, tokenId, { from: owner, value: price });
  //   (await lifeforms.tokenOfOwnerByIndex(owner, 0)).should.be.bignumber.equal(bn(1));
  // });

  // it('should return correct tokenOfOwnerByIndex after death', async () => {
  //   await lifeforms.birth(owner, tokenId, { from: owner, value: price });
  //   await increase(21);
  //   (await lifeforms.tokenOfOwnerByIndex(owner, 0)).should.be.bignumber.equal(bn(0));
  // });

  // it('should return correct tokenByIndex when alive', async () => {
  //   await lifeforms.birth(owner, tokenId, { from: owner, value: price });
  //   (await lifeforms.tokenByIndex(0)).should.be.bignumber.equal(bn(1));
  // });

  // it('should return correct tokenByIndex after death', async () => {
  //   await lifeforms.birth(owner, tokenId, { from: owner, value: price });
  //   await increase(21);
  //   (await lifeforms.tokenByIndex(0)).should.be.bignumber.equal(bn(0));
  // });

  // it('should return correct tokenByIndex after death', async () => {
  //   (await lifeforms.tokenByIndex(10)).should.be.bignumber.equal(bn(0));
  // });

  // it('should return correct totalsupply', async () => {
  //   (await lifeforms.totalSupply()).should.be.bignumber.equal(bn(0));
  // });

  // it('should return correct totalsupply when a lifefrom has been born', async () => {
  //   await lifeforms.birth(owner, tokenId, { from: owner, value: price });
  //   (await lifeforms.totalSupply()).should.be.bignumber.equal(bn(1));
  // });
});
