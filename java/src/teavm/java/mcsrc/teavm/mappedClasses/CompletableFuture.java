package mcsrc.teavm.mappedClasses;

import java.util.concurrent.Executor;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.function.Supplier;

public class CompletableFuture<T> {
    T value;

    public CompletableFuture(T value) {
        this.value = value;
    }

    public static <U> CompletableFuture<U> completedFuture(U value) {
        return new CompletableFuture<>(value);
    }

    public T join() {
        return value;
    }

    public <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor) {
        return new CompletableFuture<>(supplier.get());
    }

    public CompletableFuture<T> whenComplete(BiConsumer<? super T, ? super Throwable> action) {
        action.accept(value, null);
        return this;
    }

    public <U> CompletableFuture<U> thenApply(
            Function<? super T,? extends U> fn) {
        return new CompletableFuture<>(fn.apply(value));
    }

    public static CompletableFuture<Void> allOf(CompletableFuture<?>... cfs) {
        return new CompletableFuture<>(null);
    }
}
