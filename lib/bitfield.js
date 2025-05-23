/**
 * A bit field is a data structure that maps to one or more adjacent 
 * bits which have been allocated for specific purposes, so that any 
 * single bit or group of bits within the structure can be set or inspected. 
 * A bit field is most commonly used to represent integral types of known, 
 * fixed bit-width, such as single-bit Booleans. 
 * @module blossom/bitfield
 */

'use strict';


class Bitfield {
	
  /**
   * A bitfield backed by a node.js Buffer.
   * @constructor
   * @param {number} size - Number of bits in the bitfield
   * @param {Buffer} [buffer] - User-supplied buffer to use
   * @example 
   * const { bitfield } = require('@tacticalchihuahua/blossom');
   * const bits = new bitfield.Bitfield(8);
   *
   * bits.set(0, true);
   * bits.get(0); // true
   * bits.toggle(0);
   * bits.get(0); // false
   */
  constructor(number, buffer) {
    const size = Math.ceil(number / 8);

    if (Buffer.isBuffer(buffer) && buffer.length === size) {
      this.buffer = buffer;
    } else {
      this.buffer = Buffer.alloc(size, 0);
    }
  }

  /**
   * Set the bit value at the given index.
   * @param {number} index - Position of the bit to set
   * @param {boolean} value - Value to set
   * @returns {Bitfield}
   */
	set(index, bool) {
		const pos = index >>> 3;
		
    if (bool) {
			this.buffer[pos] |= 1 << (index % 8);
		} else {
			this.buffer[pos] &= ~(1 << (index % 8));
		}

    return this;
	}

  /**
   * Returns the value of the bit at the given index.
   * @param {number} index - Position of the bit to get
   * @returns {boolean}
   */
	get(index) {
		return (this.buffer[index >>> 3] & (1 << (index % 8))) !== 0;
	}

  /**
   * Flips the bit at the given index.
   * @param {number} index - Position of the bit to flip
   * @return {Bitfield}
   */
	toggle(index) {
		this.buffer[index >>> 3] ^= 1 << (index % 8);

    return this;
	}

  /**
   * Returns the underlying buffer.
   * @returns {Buffer}
   */
	toBuffer() {
		return this.buffer;
	}

}

module.exports.Bitfield = Bitfield;
