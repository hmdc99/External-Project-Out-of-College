import java.util.*;

public class PowerOfTwoMaxHeapTest {
    public static void main(String[] args) {
        Random rnd = new Random(42);

        // Every legal exponent against java.util.PriorityQueue, mixed insert/pop.
        for (int k = 0; k <= PowerOfTwoMaxHeap.MAX_CHILD_EXPONENT; k++) {
            int n = k == 0 ? 2_000 : 50_000; // k=0 is O(n) per op
            for (int trial = 0; trial < 3; trial++) {
                PowerOfTwoMaxHeap h = new PowerOfTwoMaxHeap(k, trial == 0 ? 0 : 4);
                PriorityQueue<Integer> ref = new PriorityQueue<>(Collections.reverseOrder());
                for (int i = 0; i < n; i++) {
                    if (ref.isEmpty() || rnd.nextInt(3) != 0) {
                        int v = trial == 2 ? rnd.nextInt(10) : rnd.nextInt();
                        h.insert(v);
                        ref.add(v);
                    } else {
                        check(h.popMax() == ref.poll(), "pop mismatch k=" + k);
                    }
                    check(h.size() == ref.size(), "size mismatch k=" + k);
                    if (!ref.isEmpty()) check(h.peekMax() == ref.peek(), "peek mismatch k=" + k);
                }
                while (!ref.isEmpty()) check(h.popMax() == ref.poll(), "drain mismatch k=" + k);
                check(h.isEmpty(), "not empty after drain");
            }
        }

        // Extreme values.
        PowerOfTwoMaxHeap h = new PowerOfTwoMaxHeap(2);
        h.insert(Integer.MIN_VALUE); h.insert(Integer.MAX_VALUE); h.insert(0); h.insert(-1);
        check(h.popMax() == Integer.MAX_VALUE, "max");
        check(h.popMax() == 0, "0");
        check(h.popMax() == -1, "-1");
        check(h.popMax() == Integer.MIN_VALUE, "min");

        // Empty and bad arguments.
        expect(NoSuchElementException.class, () -> new PowerOfTwoMaxHeap(3).popMax());
        expect(NoSuchElementException.class, () -> new PowerOfTwoMaxHeap(3).peekMax());
        expect(IllegalArgumentException.class, () -> new PowerOfTwoMaxHeap(-1));
        expect(IllegalArgumentException.class, () -> new PowerOfTwoMaxHeap(31));
        expect(IllegalArgumentException.class, () -> new PowerOfTwoMaxHeap(2, -5));

        // Sorted ascending / descending input.
        for (int k : new int[]{0, 1, 5, 30}) {
            PowerOfTwoMaxHeap a = new PowerOfTwoMaxHeap(k);
            for (int i = 0; i < 1000; i++) a.insert(i);
            for (int i = 999; i >= 0; i--) check(a.popMax() == i, "asc k=" + k);
            for (int i = 1000; i > 0; i--) a.insert(i);
            for (int i = 1000; i > 0; i--) check(a.popMax() == i, "desc k=" + k);
        }

        // Rough timing, 2M random ints.
        int[] data = new int[2_000_000];
        for (int i = 0; i < data.length; i++) data[i] = rnd.nextInt();
        for (int k : new int[]{1, 2, 3, 4, 6}) {
            long t = System.nanoTime();
            PowerOfTwoMaxHeap p = new PowerOfTwoMaxHeap(k);
            for (int v : data) p.insert(v);
            int prev = Integer.MAX_VALUE;
            while (!p.isEmpty()) { int v = p.popMax(); check(v <= prev, "order"); prev = v; }
            System.out.printf("k=%d (d=%d): %d ms%n", k, 1 << k, (System.nanoTime() - t) / 1_000_000);
        }
        System.out.println("All tests passed.");
    }

    static void check(boolean ok, String msg) { if (!ok) throw new AssertionError(msg); }

    static void expect(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); } catch (Throwable t) { if (type.isInstance(t)) return; throw new AssertionError("wrong exception " + t); }
        throw new AssertionError("expected " + type.getSimpleName());
    }
}
