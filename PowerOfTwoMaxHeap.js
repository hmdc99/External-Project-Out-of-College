'use strict';

/**
 * Array-backed max heap in which every parent has 2^childExponent children.
 *
 * childExponent = 0 gives 1 child per node (a chain), 1 gives a binary heap,
 * 2 a quaternary heap, and so on. The maximum is 30.
 *
 * Stores numbers in a Float64Array, so integers and floats both work. NaN is rejected
 * because it has no consistent ordering.
 *
 * Index math:
 *   parent(i)     = (i - 1) >>> childExponent
 *   firstChild(i) = i * branchingFactor + 1
 * JavaScript shifts are 32-bit, so the child index uses multiplication. Doubles are exact
 * up to 2^53, and any product beyond that is far larger than the heap size anyway.
 */
class PowerOfTwoMaxHeap {
  static MAX_CHILD_EXPONENT = 30;
  static #DEFAULT_CAPACITY = 16;
  static #MAX_CAPACITY = 2 ** 31 - 1;

  #childExponent;
  #branchingFactor;
  #heap;
  #size = 0;

  constructor(childExponent, initialCapacity = PowerOfTwoMaxHeap.#DEFAULT_CAPACITY) {
    if (!Number.isInteger(childExponent) ||
        childExponent < 0 || childExponent > PowerOfTwoMaxHeap.MAX_CHILD_EXPONENT) {
      throw new RangeError(
        `childExponent must be an integer in [0, ${PowerOfTwoMaxHeap.MAX_CHILD_EXPONENT}], got ${childExponent}`);
    }
    if (!Number.isInteger(initialCapacity) ||
        initialCapacity < 0 || initialCapacity > PowerOfTwoMaxHeap.#MAX_CAPACITY) {
      throw new RangeError(`invalid initialCapacity: ${initialCapacity}`);
    }
    this.#childExponent = childExponent;
    this.#branchingFactor = 2 ** childExponent;
    this.#heap = new Float64Array(Math.max(initialCapacity, 1));
  }

  get size() { return this.#size; }

  get isEmpty() { return this.#size === 0; }

  get branchingFactor() { return this.#branchingFactor; }

  peekMax() {
    if (this.#size === 0) throw new Error('heap is empty');
    return this.#heap[0];
  }

  insert(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('value must be a non-NaN number');
    }
    if (this.#size === this.#heap.length) this.#grow();
    const heap = this.#heap;
    const shift = this.#childExponent;

    // Sift up by moving parents down into a hole, then writing the value once.
    let i = this.#size++;
    while (i > 0) {
      const parent = (i - 1) >>> shift;
      const parentValue = heap[parent];
      if (parentValue >= value) break;
      heap[i] = parentValue;
      i = parent;
    }
    heap[i] = value;
  }

  popMax() {
    if (this.#size === 0) throw new Error('heap is empty');
    const heap = this.#heap;
    const max = heap[0];
    const last = heap[--this.#size];
    if (this.#size > 0) this.#siftDown(last);
    return max;
  }

  #siftDown(value) {
    const heap = this.#heap;
    const n = this.#size;
    const d = this.#branchingFactor;
    let i = 0;
    for (;;) {
      const firstChild = i * d + 1;
      if (firstChild >= n) break; // leaf
      const end = Math.min(firstChild + d, n);

      let best = firstChild;
      let bestValue = heap[firstChild];
      for (let c = firstChild + 1; c < end; c++) {
        const v = heap[c];
        if (v > bestValue) {
          bestValue = v;
          best = c;
        }
      }
      if (bestValue <= value) break;
      heap[i] = bestValue;
      i = best;
    }
    heap[i] = value;
  }

  #grow() {
    const current = this.#heap.length;
    if (current >= PowerOfTwoMaxHeap.#MAX_CAPACITY) throw new RangeError('heap capacity exceeded');
    const bigger = new Float64Array(Math.min(current * 2, PowerOfTwoMaxHeap.#MAX_CAPACITY));
    bigger.set(this.#heap);
    this.#heap = bigger;
  }
}

module.exports = { PowerOfTwoMaxHeap };
