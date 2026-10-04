import java.util.Arrays;
import java.util.NoSuchElementException;

/**
 * Array-backed max heap in which every parent has 2^childExponent children.
 *
 * childExponent = 0 gives 1 child per node (a sorted chain), 1 gives a binary heap,
 * 2 a quaternary heap, and so on. The maximum is 30 so that the branching factor fits in an int.
 *
 * Because the branching factor is a power of two, index math uses shifts:
 *   parent(i)     = (i - 1) >>> childExponent
 *   firstChild(i) = (i << childExponent) + 1
 * The first-child calculation is done in long arithmetic, since i << childExponent
 * overflows int for large exponents even when the heap is small.
 */
public final class PowerOfTwoMaxHeap {

    public static final int MAX_CHILD_EXPONENT = 30;

    private static final int DEFAULT_CAPACITY = 16;
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    private final int childExponent;
    private final int branchingFactor;
    private int[] heap;
    private int size;

    public PowerOfTwoMaxHeap(int childExponent) {
        this(childExponent, DEFAULT_CAPACITY);
    }

    public PowerOfTwoMaxHeap(int childExponent, int initialCapacity) {
        if (childExponent < 0 || childExponent > MAX_CHILD_EXPONENT) {
            throw new IllegalArgumentException(
                "childExponent must be in [0, " + MAX_CHILD_EXPONENT + "], got " + childExponent);
        }
        if (initialCapacity < 0 || initialCapacity > MAX_ARRAY_SIZE) {
            throw new IllegalArgumentException("invalid initialCapacity: " + initialCapacity);
        }
        this.childExponent = childExponent;
        this.branchingFactor = 1 << childExponent;
        this.heap = new int[Math.max(initialCapacity, 1)];
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public int branchingFactor() {
        return branchingFactor;
    }

    public int peekMax() {
        if (size == 0) throw new NoSuchElementException("heap is empty");
        return heap[0];
    }

    public void insert(int value) {
        if (size == heap.length) grow();
        // Sift up by moving parents down into a "hole", then writing the value once.
        int i = size++;
        while (i > 0) {
            int parent = (i - 1) >>> childExponent;
            int parentValue = heap[parent];
            if (parentValue >= value) break;
            heap[i] = parentValue;
            i = parent;
        }
        heap[i] = value;
    }

    public int popMax() {
        if (size == 0) throw new NoSuchElementException("heap is empty");
        int max = heap[0];
        int last = heap[--size];
        if (size > 0) siftDown(last);
        return max;
    }

    /** Places value at the root hole and sinks it to its correct position. */
    private void siftDown(int value) {
        final int[] a = heap;
        final int n = size;
        int i = 0;
        while (true) {
            long firstChildL = ((long) i << childExponent) + 1;
            if (firstChildL >= n) break; // leaf
            int firstChild = (int) firstChildL;
            int end = (int) Math.min(firstChildL + branchingFactor, (long) n);

            int best = firstChild;
            int bestValue = a[firstChild];
            for (int c = firstChild + 1; c < end; c++) {
                int v = a[c];
                if (v > bestValue) {
                    bestValue = v;
                    best = c;
                }
            }
            if (bestValue <= value) break;
            a[i] = bestValue;
            i = best;
        }
        a[i] = value;
    }

    private void grow() {
        if (heap.length >= MAX_ARRAY_SIZE) throw new IllegalStateException("heap capacity exceeded");
        long newCap = (long) heap.length << 1;
        heap = Arrays.copyOf(heap, (int) Math.min(newCap, MAX_ARRAY_SIZE));
    }
}
