const web3 = require('web3'); // eslint-disable-line import/no-extraneous-dependencies

const { BN } = web3.utils;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const maxGas = 0xfffffffffff;
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports = {
  ZERO_ADDRESS,
  ZERO_HASH,
  BN,
  maxGas,
};
