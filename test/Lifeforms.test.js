const {
  BN,
} = require('./helpers/constants');

const Lifeforms = artifacts.require('Lifeforms');

require('chai')
  .use(require('chai-bn')(BN))
  .should();

contract('Lifeforms', ([_, systemOwner, attacker, owner]) => { // eslint-disable-line no-unused-vars
  let lifeforms = null;
  const duration = 150000;
  const name = "Lifeforms";
  const symbol = "LIFE";

  beforeEach(async () => {
    lifeforms = await Lifeforms
      .new(
        name,
        symbol,
        duration,
        { from: systemOwner },
      );
  });

  it('should successfully birth a lifeform', async () => {
    const tokenId = 0;
    await lifeforms.birth(owner, tokenId, { from: owner });
    (await lifeforms.isAlive(tokenId)).should.be.equal(true);
  });
});
