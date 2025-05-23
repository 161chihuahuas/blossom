/**
 * A Bloom filter is a space-efficient probabilistic data structure used to test 
 * whether an element is a member of a set. It can quickly indicate if an item 
 * is definitely not in the set or possibly in the set, but it may produce false 
 * positives. Blossom implements several Bloom filters. All use the FNV Hash function 
 * and the optimization described by Kirsch and Mitzenmacher.
 * @see http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.72.2442&rep=rep1&type=pdf
 * @module blossom/bloom 
 */

'use strict';

const { Bitfield } = require('./bitfield');
const { FNV } = require('./fnv');

/**
 * Determines the appropriate size attribute given a capacity and error rate.
 * @function
 * @memberof module:blossom/bloom
 * @param {number} capacity - Capacity of a Bloom filter
 * @param {number} errorRate - Acceptable error ratio for filter
 * @returns {number}
 */
function calculateSize(capacity, errorRate) {
	const log2sq = 0.480453;  // Math.pow(Math.log(2), 2)
	return Math.ceil(capacity * Math.log(errorRate) / -log2sq);
}

/**
 * Determines how many slices the filter should use for hashing.
 * @param {number} size - Size of the underlying {@link module:blossom/bitfield~Bitfield}
 * @param {number} capacity - Capacity of a Bloom filter
 * @returns {number}
 */
function calculateSlices(size, capacity) {
	return size / capacity * Math.log(2);
}

/**
 * Calculates the hashes for an item in a Bloom filter.
 * @param {string|Buffer} key - The item to hash
 * @param {number} size - The size of the resulting hash
 * @param {number} slices - Total slices to use for hashing
 * @returns {Array<number>}
 * @see {@link http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.72.2442}
 */
function calulateHashes(key, size, slices) {
	function fnv(seed, data) {
		const h = new FNV();

		h.update(seed);
		h.update(data);
		
    return h.value() >>> 0;
	}

	const h1 = fnv(Buffer.from('S'), key);
	const h2 = fnv(Buffer.from('W'), key);
	const hashes = [];

	for (let i = 0; i < slices; i++) {
		hashes.push((h1 + i * h2) % size);
	}

	return hashes;
}


class BloomFilter {

  /**
   * Classic Bloom filter dimensioned by the size of the bitfield 
   * and the number of hash functions.
   * @param {number} [size=16] - Total bits in the underlying buffer
   * @param {number} [slices=2] - Number of hash functions
   * @param {Buffer} [buffer=Buffer.alloc(size)] - Underlying buffer to use
   */
  constructor(size = 16, slices = 2, buffer) {
    this.size = size;
    this.slices = slices;
    this.bitfield = new Bitfield(size, buffer);
  }

  /**
   * Add an item to the Bloom filter.
   * @param {string|Buffer} key - Item to add
   * @returns {BloomFilter}
   */
	add(key) {
		const hashes = calulateHashes(key, this.size, this.slices);
    
		for (let i = 0; i < hashes.length; i++) {
			this.bitfield.set(hashes[i], true);
		}

    return this;
	}
	
  /**
   * Check if an item probably exists in the Bloom filter
   * @param {string|Buffer} key - Item to check
   * @returns {boolean}
   */
  has(key) {
		const hashes = calulateHashes(key, this.size, this.slices);

		for (let i = 0; i < hashes.length; i++) {
			if (!this.bitfield.get(hashes[i])) {
        return false;
      }
		}

		return true;
	}

  /**
   * Create a {@link BloomFilter} from an object.
   * @param {object} data
   * @param {number} data.size - Bloom filter size
   * @param {number} data.slices - Number of hashes to use.
   * @param {object} data.bitfield
   * @param {string|Buffer|array} data.bitfield.buffer - Underlying buffer to use
   * @returns {BloomFilter}
   */
  static destringify(data) {
	  const filter = new BloomFilter(data.size, data.slices);
	  filter.bitfield.buffer = Buffer.from(data.bitfield.buffer);

	  return filter;
  }

}

class SafeBloomFilter {
  
  /**
   * Bloom filter enforcing a given false positive error 
   * probabilty for a given capacity.
   * @param {number} [capacity=20] - Max number of items allowed
   * @param {number} [errorRate=0.1] - Max false positive error probabilty
   * @param {Buffer} [buffer] - Underlying buffer to use
   */
  constructor(capacity = 20, errorRate = 0.1, buffer) {
    const size = calculateSize(capacity, errorRate);
    const slices = calculateSlices(size, capacity);
    
    this.capacity = capacity;
    this.errorRate = errorRate;
    this.count = 0;
    this.filter = new BloomFilter(size, slices, buffer);
  }

  /**
   * Adds item the the Bloom filter only if it is under capacity.
   * @param {string|Buffer} key - Item to add
   * @returns {boolean} wasAdded
   */
	add(key) {
		if (this.count >= this.capacity) {
			return false;
		}

		this.filter.add(key);
		this.count++;
		
    return true;
	}

  /**
   * Checks if the given item probably exists in the Bloom filter.
   * @param {string|Buffer} key - Item to check
   * @returns {boolean}
   */
	has(key) {
		return this.filter.has(key);
	}

  /**
   * Create a {@link SafeBloomFilter} from an object
   * @param {object} data
   * @param {number} data.capacity - Max items to allow in filter
   * @param {number} data.errorRate - Max false positive rate allowed
   * @param {number} data.count - Number of items in filter
   * @param {object} data.bitfield
   * @param {string|array|object|Buffer} data.bitfield.buffer - Underlying buffer
   * @returns {SafeBloomFilter}
   */
  static destringify(data) {
    const filter = new SafeBloomFilter(data.capacity, data.errorRate);
    filter.count = data.count;
    filter.filter.bitfield.buffer = Buffer.from(data.filter.bitfield.buffer);

    return filter;
  }

}

class ScalingBloomFilter {
  
  /**
   * A scaling bloom filter (SBF) as described by Almeida et al.
   * @see {@link http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.62.7953&rep=rep1&type=pdf}
   * @param {number} [errorRate=0.1] - Max false positive probabilty
   * @param {object} [options]
   * @param {number} [options.ratio=0.9] - Error rate ratio
   * @param {number} [options.scaling=2] - Scaling factor
   * @param {number} [options.initialCapacity=1000] - Starting capacity for underlying {@link SafeBloomFilter}
   */
  constructor(errorRate = 0.1, options) {
    options = options || {};

    this.errorRate = errorRate;
    this.ratio = options.ratio || 0.9;
    this.scaling = options.scaling || 2;
    this.initialCapacity = options.initialCapacity || 1000;
    this.filters = [
      new SafeBloomFilter(this.initialCapacity, errorRate * (1 - this.ratio))
    ];
  }

  /**
   * Add item to the SBF
   * @param {string|Buffer} key - Item to add
   * @returns {ScalingBloomFilter}
   */
	add(key) {
		let f = this.filters.slice(-1)[0];

		if (f.add(key)) {
			return;
		}

		f = new SafeBloomFilter(
      f.capacity * this.scaling, 
      f.errorRate * this.ratio
    );
		
    f.add(key);
    this.filters.push(f);

    return this;
	}

  /**
   * Checks if an item probably exists in the filter
   * @param {string|Buffer} key - Item to check
   * @returns {boolean}
   */
	has(key) {
		for (let i = this.filters.length; i-- > 0;) {
			if (this.filters[i].has(key)) {
				return true;
			}
		}

		return false;
	}

  /**
   * Create a {@link ScalingBloomFilter} from an object
   * @param {object} data
   * @param {number} data.ratio - SBF ratio to use
   * @param {number} data.scaling - Scaling factor
   * @param {number} data.initialCapacity - Starting capacity for underlying {@link module:blossom/bloom~SafeBloomFilter}
   * @param {Array<object>} data.filters - Serialized data for filters passed to {@link module:blossom/bloom~SafeBloomFilter.destringify}
   * @returns {ScalingBloomFilter}
   */
  static destringify(data) {
    const filter = new ScalingBloomFilter(data.errorRate, {
      ratio: data.ratio,
      scaling: data.scaling,
      initialCapacity: data.initialCapacity
    });

    filter.filters = [];

    for (let i = 0; i < data.filters.length; i++) {
      filter.filters.push(
        SafeBloomFilter.destringify(data.filters[i])
      );
    }

    return filter;
  }

}

class AttenuatedBloomFilter extends Array {

  static get [Symbol.species]() {
    return Array;
  }

  /**
   * Constructs an empty attenuated bloom filter given a bitfield size
   * and a filter depth.
   * @constructor
   * @extends {Array}
   * @param {object} [options]
   * @param {number} [options.bitfieldSize=160] - Size of the underlying bitfields
   * @param {number} [options.filterDepth=3] - Number of {@link module:blossom/bloom~BloomFilter}s
   */
  constructor(options = {}) {
    super();

    this.bitfieldSize = options.bitfieldSize || 160;
    this.filterDepth = options.filterDepth || 3;

    for (let i = 0; i < this.filterDepth; i++) {
      this.push(new BloomFilter(this.bitfieldSize, 2));
    }
  }

  /**
   * Returns a comma delimited string of each filter serialized to hex strings.
   * @returns {string}
   */
  toString() {
    return this.toHexArray().toString();
  }

  /**
   * Returns an array of hex string serialized filters.
   * @returns {string[]}
   */
  toHexArray() {
    return this.map(
      (bloomFilter) => bloomFilter.bitfield.toBuffer().toString('hex')
    );
  }

  /**
   * Merges a foreign attenuated filter into ours.
   * @param {AttenuatedBloomFilter} foreignFilters - The attenuated filter to
   * merge into ours (uses bitwise OR operation)
   * @returns {AttenuatedBloomFilter}
   */
  merge(foreignFilters) {
    for (let [localIndex, localFilter] of this.entries()) {
      if (localIndex === 0) {
        continue;
      }

      let foreignFilter = foreignFilters[localIndex - 1];
      let { data: foreignFilterBytes } = foreignFilter.bitfield.buffer.toJSON();
      let localFilterBuffer = localFilter.bitfield.buffer;

      if (!foreignFilters[localIndex - 1]) {
        return this;
      }

      for (let [bytePos, byteValue] of foreignFilterBytes.entries()) {
        localFilterBuffer[bytePos] = localFilterBuffer[bytePos] | byteValue;
      }
    }

    return this;
  }

  /**
   * Constructs a attentuated bloom filter from a array of hex strings
   * @static
   * @memberof AttenuatedBloomFilter
   * @param {string[]} hexFilters
   */
  static from(hexFilters) {
    const filters = new AttenuatedBloomFilter({
      bitfieldSize: Buffer.from(hexFilters[0], 'hex').length * 8,
      filterDepth: hexFilters.length
    });

    hexFilters.forEach((hexString, i) => {
      filters[i].bitfield.buffer = Buffer.from(hexString, 'hex')
    });

    return filters;
  }

}

module.exports.calulateHashes = calulateHashes;
module.exports.calculateSize = calculateSize;
module.exports.calculateSlices = calculateSlices;
module.exports.BloomFilter = BloomFilter;
module.exports.SafeBloomFilter = SafeBloomFilter;
module.exports.ScalingBloomFilter = ScalingBloomFilter;
module.exports.AttenuatedBloomFilter = AttenuatedBloomFilter;
