'use strict';

const { AttenuatedBloomFilter } = require('../lib/bloom');
const { expect } = require('chai');

describe('AttenuatedBloomFilter', function() {

  describe('@constructor', function() {

    it('should use the default depth and size', function() {
      let atbf = new AttenuatedBloomFilter();
      expect(atbf.filterDepth).to.equal(3);
      expect(atbf.bitfieldSize).to.equal(160);
      expect(atbf).to.have.lengthOf(3);
      expect(atbf[0].bitfield.buffer).to.have.lengthOf(160 / 8);
    });

    it('should use the given depth and size', function() {
      let atbf = new AttenuatedBloomFilter({
        bitfieldSize: 256,
        filterDepth: 6
      });
      expect(atbf.filterDepth).to.equal(6);
      expect(atbf.bitfieldSize).to.equal(256);
      expect(atbf).to.have.lengthOf(6);
      expect(atbf[0].bitfield.buffer).to.have.lengthOf(256 / 8);
    });

  });

  describe('#toString', function() {

    it('should return a comma delimited string of hex filters', function() {
      let atbf = new AttenuatedBloomFilter();
      atbf[0].add('test one');
      atbf[1].add('test two');
      atbf[2].add('test three');
      let str = atbf.toString();
      expect(str).to.equal('0000000000000100000000000040000000000000,' +
                           '0010000000001000000000000000000000000000,' +
                           '0000000040000000000000000100000000000000');
    });

  });

  describe('#toHexArray', function() {

    it('should return an array of hex strings', function() {
      let atbf = new AttenuatedBloomFilter();
      atbf[0].add('test one');
      atbf[1].add('test two');
      atbf[2].add('test three');
      let arr = atbf.toHexArray();
      expect(arr[0]).to.equal('0000000000000100000000000040000000000000');
      expect(arr[1]).to.equal('0010000000001000000000000000000000000000');
      expect(arr[2]).to.equal('0000000040000000000000000100000000000000');
    });

  });

  describe('#merge', function() {

    it('should merge the two attenuated filters', function() {
      let atbf1 = new AttenuatedBloomFilter();
      let atbf2 = new AttenuatedBloomFilter()
      atbf1[0].add('foo');
      atbf1[1].add('bar');
      atbf1[2].add('baz');
      atbf2[0].add('foo');
      atbf2[1].add('bar');
      atbf2[2].add('baz');
      atbf1.merge(atbf2);
      expect(atbf1[0].has('bar')).to.equal(false);
      expect(atbf1[0].has('baz')).to.equal(false);
      expect(atbf1[0].has('foo')).to.equal(true);
      expect(atbf1[1].has('foo')).to.equal(true);
      expect(atbf1[1].has('bar')).to.equal(true);
      expect(atbf1[1].has('baz')).to.equal(false);
      expect(atbf1[2].has('bar')).to.equal(true);
      expect(atbf1[2].has('baz')).to.equal(true);
      expect(atbf1[2].has('foo')).to.equal(false);
    });

  });

});

describe('AttenuatedBloomFilter#from', function() {

  it('should return a object from the hex string array', function() {
    let arr = [
      '0000000000000100000000000040000000000000',
      '0010000000001000000000000000000000000000',
      '0000000040000000000000000100000000000000'
    ];
    let atbf = AttenuatedBloomFilter.from(arr);
    expect(atbf.filterDepth).to.equal(3);
    expect(atbf.bitfieldSize).to.equal(160);
    expect(atbf).to.have.lengthOf(3);
    expect(atbf[0].bitfield.buffer).to.have.lengthOf(160 / 8);
    expect(atbf[0].has('test one')).to.equal(true);
    expect(atbf[1].has('test two')).to.equal(true);
    expect(atbf[2].has('test three')).to.equal(true);
  });

});
