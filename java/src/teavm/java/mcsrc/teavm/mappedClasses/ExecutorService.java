package mcsrc.teavm.mappedClasses;

import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

public interface ExecutorService {
    void shutdown();

    boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException;

    <T> Future<T> submit(Callable<T> task);

    Future<?> submit(Runnable task);
}
