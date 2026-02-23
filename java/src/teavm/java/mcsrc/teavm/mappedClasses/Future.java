package mcsrc.teavm.mappedClasses;

import java.util.concurrent.ExecutionException;

public interface Future<V> {
    V get() throws InterruptedException, ExecutionException;
}
