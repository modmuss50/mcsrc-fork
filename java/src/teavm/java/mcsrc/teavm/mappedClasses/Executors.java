package mcsrc.teavm.mappedClasses;

import mcsrc.teavm.ConcurrentImpl;

public class Executors {
    public static ExecutorService newFixedThreadPool(int nThreads) {
        return ConcurrentImpl.BLOCKING_INSTANCE;
    }
}
