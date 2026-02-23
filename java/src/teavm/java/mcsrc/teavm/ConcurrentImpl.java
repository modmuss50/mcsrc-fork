package mcsrc.teavm;

import mcsrc.teavm.mappedClasses.ExecutorService;
import mcsrc.teavm.mappedClasses.Future;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

public class ConcurrentImpl implements ExecutorService {
    public static final ExecutorService BLOCKING_INSTANCE = new ConcurrentImpl();

    @Override
    public <T> Future<T> submit(Callable<T> task) {
        return () -> {
            try {
                return task.call();
            } catch (Exception e) {
                throw new ExecutionException(e);
            }
        };
    }

    @Override
    public Future<?> submit(Runnable task) {
        return (Future<Object>) () -> {
            task.run();
            return null;
        };
    }

    @Override
    public void shutdown() {
    }

    @Override
    public boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException {
        return true;
    }
}
