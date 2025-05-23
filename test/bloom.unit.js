'use strict';

const assert = require('assert')
const bloom = require('../lib/bloom');

describe('BloomFilter', function() {;

  it('#empty', function() {
    var f = new bloom.BloomFilter(8, 2)
    assert.equal(f.has(Buffer('foo')), false)
  });

  it('#add', function() {
    var f = new bloom.BloomFilter(8, 2)
    assert.equal(f.has(Buffer('foo')), false)
    f.add(Buffer('foo'))
    assert.equal(f.has(Buffer('foo')), true)
    assert.equal(f.has(Buffer('bar')), false)
  });

  it('#destringify', function() {
    var f = new bloom.BloomFilter(8, 2)
    f.add(Buffer('foo'))
    f = bloom.BloomFilter.destringify(JSON.parse(JSON.stringify(f)))
    assert.equal(f.has(Buffer('foo')), true)
    assert.equal(f.has(Buffer('bar')), false)
  });

});

describe('SafeBloomFilter', function() {;

  it('#empty', function() {
    var f = new bloom.SafeBloomFilter(10, 0.01)
    assert.equal(f.has(Buffer('foo')), false)
  });

  it('#add-and-stop', function() {
    var f = new bloom.SafeBloomFilter(10, 0.02)
    for(var i = 0; i < 10; i++) {
      var b = Buffer(i.toString())
      assert.equal(f.has(b), false)
      assert.equal(f.add(b), true)
      assert.equal(f.has(b), true)
    }
    for(var i = 10; i < 15; i++) {
      var b = Buffer(i.toString())
      assert.equal(f.has(b), false)
      assert.equal(f.add(b), false)
      assert.equal(f.has(b), false)
    }
  });

  it('#destringify', function() {
    var f = new bloom.SafeBloomFilter(3, 0.002)
    assert.equal(f.add('one'), true)
    assert.equal(f.add('two'), true)
    f = bloom.SafeBloomFilter.destringify(JSON.parse(JSON.stringify(f)))
    assert.equal(f.has('one'), true)
    assert.equal(f.has('two'), true)

    assert.equal(f.has('three'), false)
    assert.equal(f.add('three'), true)
    assert.equal(f.has('three'), true)

    assert.equal(f.has('four'), false)
    assert.equal(f.add('four'), false)
  });

});


describe('ScalingBloomFilter', function() {

  it('#empty', function() {
    var f = new bloom.ScalingBloomFilter(0.01)
    assert.equal(f.has(Buffer('foo')), false)
  });

  it('#add-and-grow', function() {
    var f = new bloom.ScalingBloomFilter(0.0005, {initialCapacity: 20})
    for(var i = 0; i < 100; i++) {
      var b = Buffer(i.toString())
      assert.equal(f.has(b), false)
      f.add(b)
      assert.equal(f.has(b), true)
    }
    for(var i = 0; i < 100; i++) {
      assert.equal(f.has(b), true)
    }
    for(var i = 100; i < 200; i++) {
      var b = Buffer(i.toString())
      assert.equal(f.has(b), false)
    }
    assert.equal(f.filters.length, 3)
  });

  it('#destringify', function() {
    var f = new bloom.ScalingBloomFilter(0.02, {initialCapacity: 2})
    f.add('one')
    f.add('two')
    f.add('three')
    f = bloom.ScalingBloomFilter.destringify(JSON.parse(JSON.stringify(f)))
    assert.equal(f.has('one'), true)
    assert.equal(f.has('two'), true)
    assert.equal(f.has('three'), true)
    assert.equal(f.has('four'), false)

    f.add('four')
    f.add('five')
    f.add('six')
    f.add('seven')

    assert.equal(f.has('seven'), true)
    assert.equal(f.filters.length, 3)
  });
});
