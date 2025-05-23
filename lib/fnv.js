/**
 * FNV (Fowler/Noll/Vo) is a fast, 
 * non-cryptographic hash algorithm with good dispersion. 
 * FNV hashes are designed to be fast while maintaining a low collision
 * rate. The high dispersion of the FNV hashes makes them well suited
 * for hashing nearly identical strings such as URLs, hostnames,
 * filenames, text, IP addresses, etc. Their speed allows one to quickly
 * hash lots of data while maintaining a reasonably low collision rate.
 * However, they are generally not suitable for cryptographic use.
 * @see http://tools.ietf.org/html/draft-eastlake-fnv-04 
 * @module blossom/fnv
 */

'use strict';

const { Transform } = require('node:stream');


class FNV extends Transform {
  /**
   * Implements FNV hash function. 
   * @constructor
   * @extends {stream.Transform}
   * @param {object} [streamOptions] - {@link https://nodejs.org/api/stream.html#api-for-stream-consumers}
   * @example
   * const { fnv } = require('@tacticalchihuahua/blossom');
   * const fnvHash = fnv.createHash();
   *
   * fnvHash.update('acab', 'hex');
   * console.log(fnvHash.digest('hex'));
   * @example
   * const { fnv } = require('@tacticalchihuahua/blossom');
   * const fnvHash = new fnv.FNV();
   *
   * fnvHash.write('acab', 'hex');
   * fnvHash.pipe(process.stdout);
   */
  constructor(options) {
    super(options);
    this.hash = 0x811c9dc5; // offset basis 
  }

  _transform(data, encoding, callback) {
    try {
      this.update(data, encoding === 'buffer'
        ? undefined
        : encoding);
    } catch (e) {
      return callback(e);
    }

    callback(null);
  }

  _flush(callback) {
    callback(null, this.digest());
  }

  /**
   * Updates the hash function with the given data
   * @param {string|Buffer} data - Data to hash
   * @param {string} [encoding] - If data is a string, specify the encoding
   * @returns {FNV}
   */
  update(data, encoding) {
    if (typeof data === 'string') {
      data = Buffer.from(data, encoding);
    } else if (!Buffer.isBuffer(data)) {
      throw TypeError('Expected a String or Buffer');
    }
    
    for (let i = 0; i < data.length; i++) {
      this.hash = this.hash ^ data[i];

      // 32 bit FNV prime = 2**24 + 2**8 + 0x93
      this.hash += 
        (this.hash << 24) + 
        (this.hash << 8) + 
        (this.hash << 7) + 
        (this.hash << 4) + 
        (this.hash << 1);
    }

    return this;
  }

  /**
   * Returns the computed FNV hash
   * @param {string} [encoding] - Encoding type to return
   * @returns {string|Buffer}
   */
  digest(encoding) {
    const buf = Buffer.alloc(4);

    buf.writeInt32BE(this.hash & 0xffffffff, 0);
    
    if (encoding) {
      return buf.toString(encoding);
    } else {
      return buf;
    }
  }

  /**
   * Returns the current hash value
   * @returns {number}
   */ 
  value() {
    return this.hash & 0xffffffff;
  }

}

/**
 * @function createHash
 * @memberof module:blossom/fnv
 * @returns {FNV}
 */
function createHash() {
  return new FNV();
}

module.exports.FNV = FNV
module.exports.createHash = createHash;
