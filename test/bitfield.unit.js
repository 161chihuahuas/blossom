'use strict'

const assert = require('assert')
const { Bitfield } = require('../lib/bitfield');

describe('Bitfield', function() {

  it('#zeroinit', function() {
    const b = new Bitfield(10);
    assert.equal(b.get(7), false);
    assert.equal(b.get(9), false);
  });

  it('#set', function() {
    const b = new Bitfield(32);
    assert.equal(b.get(13), false);
    assert.equal(b.get(14), false);
    assert.equal(b.get(15), false);
    b.set(14, true);
    assert.equal(b.get(13), false);
    assert.equal(b.get(14), true);
    assert.equal(b.get(15), false);
  });

  function big(bit) {
    const b = new Bitfield(bit + 1);
    assert.equal(b.get(bit), false);
    b.set(bit, true);
    assert.equal(b.get(bit), true);
    assert.equal(
      (b.buffer[(bit / 8)|0] & (1 << (bit % 8))) != 0,
      true
    );
  }

  it('#bigone_2852448540', function() {
    big(2852448540);
  });

  it('#bigone_2g', function() {
    big(Math.pow(2,31));
  });

  it('#bigone_4g', function() {
    big(Math.pow(2,32) - 1);
  });

  it('#bigone_64g', function() {
    assert.throws(
      function() {
        return new Bitfield(Math.pow(2,39));
      },
      RangeError
    )
  });

});
