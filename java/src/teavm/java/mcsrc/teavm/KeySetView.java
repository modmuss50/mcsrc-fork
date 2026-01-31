package mcsrc.teavm;

import java.util.Collection;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class KeySetView<K, V> implements Set<K> {
    private final ConcurrentHashMap<K, V> map;
    private final V value;

    public KeySetView(ConcurrentHashMap<K, V> map, V mappedValue) {
        this.map = map;
        this.value = mappedValue;
    }

    @SuppressWarnings({"unchecked", "DataFlowIssue", "unused"})
    public static <K> ConcurrentHashMap.KeySetView<K, Boolean> newKeySet() {
        return (ConcurrentHashMap.KeySetView<K, Boolean>) ((Object) (new KeySetView<>(new ConcurrentHashMap<>(), Boolean.TRUE)));
    }

    @Override
    public int size() {
        return map.size();
    }

    @Override
    public boolean isEmpty() {
        return map.isEmpty();
    }

    @Override
    public boolean contains(Object o) {
        return map.containsKey(o);
    }

    @Override
    public Object[] toArray() {
        return map.keySet().toArray();
    }

    @Override
    public <T> T[] toArray(T[] a) {
        return map.keySet().toArray(a);
    }

    @Override
    public boolean add(K k) {
        return map.put(k, value) == null;
    }

    @Override
    public boolean remove(Object o) {
        return map.remove(o) != null;
    }

    @Override
    public boolean containsAll(Collection<?> c) {
        return map.keySet().containsAll(c);
    }

    @Override
    public boolean addAll(Collection<? extends K> c) {
        return map.keySet().addAll(c);
    }

    @Override
    public boolean removeAll(Collection<?> c) {
        return map.keySet().removeAll(c);
    }

    @Override
    public boolean retainAll(Collection<?> c) {
        return map.keySet().retainAll(c);
    }

    @Override
    public void clear() {
        map.clear();
    }

    @Override
    public Iterator<K> iterator() {
        return map.keySet().iterator();
    }
}
