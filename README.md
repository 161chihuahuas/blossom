# 🌸 blossom ~ *scalable bloom filters*

```
npm install @yipyap/blossom --save
```

This package contains a small handful of utilities for efficient 
probablistic checking for members in a set. This is achieved through 
the implementation of different [Bloom filters](https://en.wikipedia.org/wiki/Bloom_filter). 
This package is a heavily refactored fork of [node-bloem](https://github.com/wiedi/node-bloem) 
(which hasn't seen a commit in at least 11 years), that I intend to 
maintain for use in [🝰 dusk](https://rundusk.org). Many thanks to the 
authors for their work.

> A Bloom filter is a space-efficient probabilistic data structure 
> used to test whether an element is a member of a set. It can quickly 
> indicate if an item is definitely not in the set or possibly in the set,
> but it may produce false positives.

### example

```js
const { BloomFilter } = require('@yipyap/blossom').bloom;
const bloomFilter = new BloomFilter();

bloomFilter.add(Buffer.from('00acab00', 'hex'));
bloomFilter.add(Buffer.from('00131200', 'hex'));

console.log(bloomFilter.has(Buffer.from('00acab00', 'hex'))); // true
console.log(bloomFilter.has(Buffer.from('00131200', 'hex'))); // true
console.log(bloomFilter.has(Buffer.from('12345678', 'hex'))); // false
```

### copying

anti-copyright 2025, chihuahua.rodeo  
licensed under the lesser gnu general public license 3.0
