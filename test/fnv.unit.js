'use strict'

const assert = require('assert')
const { FNV } = require('../lib/fnv');

describe('FNV', function() {

  it('Chainable .update()', function() {
    assert.equal(new FNV().update('foobar').digest('hex'), 'bf9cf968');
  });

  it('#init', function() {
    const h = new FNV();
    assert.equal(h.digest('hex'), '811c9dc5');
  });

  it('#empty', function() {
    const h = new FNV()
    h.update(Buffer.from(''));
    assert.equal(h.digest('hex'), '811c9dc5');
  });

  it('#foobar', function() {
    const h = new FNV();
    h.update(Buffer.from('foobar'));
    assert.equal(h.digest('hex'), 'bf9cf968');
  });

  it('#a', function() {
    const h = new FNV();
    h.update(Buffer.from('a'));
    assert.equal(h.digest('hex'), 'e40c292c');
  });

  it('#foobar-zero', function() {
    const h = new FNV();
    h.update(Buffer.from('foobar\0'));
    assert.equal(h.digest('hex'), '0c1c9eb8');
  });

  it('#foo split bar', function() {
    const h = new FNV();
    h.update(Buffer.from('foo'));
    h.update(Buffer.from('bar'));
    assert.equal(h.digest('hex'), 'bf9cf968');
  });

  it('#type string', function() {
    let h = new FNV();
    h.update('');
    assert.equal(h.digest('hex'), '811c9dc5');
    h.update('foobar');
    assert.equal(h.digest('hex'), 'bf9cf968');
    h = new FNV();
    h.update('a');
    assert.equal(h.digest('hex'), 'e40c292c');
  });

  it('#type not supported', function() {
    const h = new FNV();
    assert.throws(
      function() {
        h.update({foo: 42})
      }
    );
  });

});
