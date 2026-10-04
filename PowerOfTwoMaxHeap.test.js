'use strict';
const assert = require('node:assert');
const { PowerOfTwoMaxHeap } = require('./PowerOfTwoMaxHeap');

// Simple deterministic PRNG so failures reproduce.
let seed = 42;
const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const randInt = (n) => Math.floor(rand() * n);

// Every legal exponent against a sorted-array reference, mixed insert/pop.
for (let k = 0; k <= PowerOfTwoMaxHeap.MAX_CHILD_EXPONENT; k++) {
  const n = k === 0 ? 1500 : 20000;
  for (let trial = 0; trial < 3; trial++) {
    const h = new PowerOfTwoMaxHeap(k, trial === 0 ? 0 : 4);
    const ref = [];
    for (let i = 0; i < n; i++) {
      if (ref.length === 0 || randInt(3) !== 0) {
        const v = trial === 2 ? randInt(10) : (rand() - 0.5) * 2 ** 40;
        h.insert(v);
        ref.push(v);
        ref.sort((a, b) => a - b);
      } else {
        assert.strictEqual(h.popMax(), ref.pop(), `pop mismatch k=${k}`);
      }
      assert.strictEqual(h.size, ref.length);
      if (ref.length) assert.strictEqual(h.peekMax(), ref[ref.length - 1]);
    }
    while (ref.length) assert.strictEqual(h.popMax(), ref.pop(), `drain mismatch k=${k}`);
    assert.ok(h.isEmpty);
  }
}

// Extreme values.
{
  const h = new PowerOfTwoMaxHeap(2);
  for (const v of [-Infinity, Infinity, 0, -1, Number.MAX_VALUE, -Number.MAX_VALUE]) h.insert(v);
  assert.deepStrictEqual(
    [h.popMax(), h.popMax(), h.popMax(), h.popMax(), h.popMax(), h.popMax()],
    [Infinity, Number.MAX_VALUE, 0, -1, -Number.MAX_VALUE, -Infinity]);
}

// Empty heap and bad arguments.
assert.throws(() => new PowerOfTwoMaxHeap(3).popMax(), /empty/);
assert.throws(() => new PowerOfTwoMaxHeap(3).peekMax(), /empty/);
assert.throws(() => new PowerOfTwoMaxHeap(-1), RangeError);
assert.throws(() => new PowerOfTwoMaxHeap(31), RangeError);
assert.throws(() => new PowerOfTwoMaxHeap(1.5), RangeError);
assert.throws(() => new PowerOfTwoMaxHeap(2, -5), RangeError);
assert.throws(() => new PowerOfTwoMaxHeap(2).insert(NaN), TypeError);
assert.throws(() => new PowerOfTwoMaxHeap(2).insert('5'), TypeError);

// Ascending and descending input.
for (const k of [0, 1, 5, 30]) {
  const h = new PowerOfTwoMaxHeap(k);
  for (let i = 0; i < 1000; i++) h.insert(i);
  for (let i = 999; i >= 0; i--) assert.strictEqual(h.popMax(), i);
  for (let i = 1000; i > 0; i--) h.insert(i);
  for (let i = 1000; i > 0; i--) assert.strictEqual(h.popMax(), i);
}

// Rough timing, 2M random numbers.
const data = new Float64Array(2_000_000).map(() => rand());
for (const k of [1, 2, 3, 4, 6]) {
  const t = process.hrtime.bigint();
  const h = new PowerOfTwoMaxHeap(k);
  for (const v of data) h.insert(v);
  let prev = Infinity;
  while (!h.isEmpty) { const v = h.popMax(); assert.ok(v <= prev); prev = v; }
  console.log(`k=${k} (d=${2 ** k}): ${Number((process.hrtime.bigint() - t) / 1_000_000n)} ms`);
}
console.log('All tests passed.');
