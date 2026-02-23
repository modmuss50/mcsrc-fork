package mcsrc.teavm;

import org.teavm.model.*;
import org.teavm.model.instructions.*;
import org.teavm.vm.spi.TeaVMHost;
import org.teavm.vm.spi.TeaVMPlugin;

import java.lang.reflect.Field;
import java.util.*;

public class Plugin implements TeaVMPlugin, ClassHolderTransformer {
    private static final Map<String, String> MAPPED_METHODS = Map.of(
            "java.util.concurrent.ConcurrentHashMap#newKeySet", "mcsrc.teavm.KeySetView",
            "java.lang.Integer#parseUnsignedInt", "mcsrc.teavm.Unsigned",
            "java.lang.Long#parseUnsignedLong", "mcsrc.teavm.Unsigned"
    );

    private static final Set<String> MAPPED_CLASSES = Set.of(
            "java.util.concurrent.Executors",
            "java.util.concurrent.ExecutorService",
            "java.util.concurrent.CompletableFuture",
            "java.util.concurrent.Future",
            "javax.lang.model.SourceVersion",
            "java.lang.TypeNotPresentException",
            "java.util.concurrent.locks.ReentrantLock",
            "java.util.concurrent.locks.Lock"
    );

    @Override
    public void install(TeaVMHost host) {
        host.add(this);
    }

    @Override
    public void transformClass(ClassHolder cls, ClassHolderTransformerContext context) {
        Map<MethodDescriptor, MethodDescriptor> descFixes = new HashMap<>();

        for (final MethodHolder method : cls.getMethods()) {
            if (method.getProgram() == null) continue;

            for (final BasicBlock block : method.getProgram().getBasicBlocks()) {
                for (final Instruction insn : block) {
                    if (insn instanceof InvokeInstruction invokeInsn) {
                        MethodReference methodReference = invokeInsn.getMethod();
                        invokeInsn.setMethod(new MethodReference(remapType(methodReference.getClassName()), methodReference.getName(), remapType(methodReference.getSignature())));
                    } else if (insn instanceof ConstructInstruction constructInsn) {
                        constructInsn.setType(remapType(constructInsn.getType()));
                    } else if (insn instanceof ConstructArrayInstruction constructArrayInsn) {
                        constructArrayInsn.setItemType(remapType(constructArrayInsn.getItemType()));
                    } else if (insn instanceof ConstructMultiArrayInstruction constructMultiArrayInsn) {
                        constructMultiArrayInsn.setItemType(remapType(constructMultiArrayInsn.getItemType()));
                    } else if (insn instanceof CastInstruction castInsn) {
                        castInsn.setTargetType(remapType(castInsn.getTargetType()));
                    } else if (insn instanceof ClassConstantInstruction classConstantInsn) {
                        classConstantInsn.setConstant(remapType(classConstantInsn.getConstant()));
                    } else if (insn instanceof IsInstanceInstruction isInstanceInsn) {
                        isInstanceInsn.setType(remapType(isInstanceInsn.getType()));
                    } else if (insn instanceof GetFieldInstruction getFieldInsn) {
                        getFieldInsn.setFieldType(remapType(getFieldInsn.getFieldType()));
                    } else if (insn instanceof PutFieldInstruction putFieldInsn) {
                        putFieldInsn.setFieldType(remapType(putFieldInsn.getFieldType()));
                    }
                }
            }

            ValueType[] types = method.getDescriptor().getSignature();

            try {
                Field signature = MethodDescriptor.class.getDeclaredField("signature");
                signature.setAccessible(true);
                signature.set(method.getDescriptor(), remapType(types));

                Field hash = MethodDescriptor.class.getDeclaredField("hash");
                hash.setAccessible(true);
                hash.set(method.getDescriptor(), 0);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        // Massive hack as we changed the hashcode of the method descriptors, we need to clear the method map so it can be rebuilt with the new hashes
        try {
            Field methods = ClassHolder.class.getDeclaredField("methods");
            methods.setAccessible(true);
            methods.set(cls, new LinkedHashMap<>((Map<MethodDescriptor, MethodHolder>) methods.get(cls)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static ValueType[] remapType(ValueType[] types) {
        ValueType[] remapped = new ValueType[types.length];
        for (int i = 0; i < types.length; i++) {
            remapped[i] = remapType(types[i]);
        }
        return remapped;
    }

    private static ValueType remapType(ValueType valueType) {
        if (valueType instanceof ValueType.Object objectType) {
            return new ValueType.Object(remapType(objectType.getClassName()));
        } else if (valueType instanceof ValueType.Array arrayType) {
            return new ValueType.Array(remapType(arrayType.getItemType()));
        }

        return valueType;
    }

    private static String remapType(String name) {
        if (!MAPPED_CLASSES.contains(name)) {
            return name;
        }

        String className = name.substring(name.lastIndexOf(".") + 1);
        return "mcsrc.teavm.mappedClasses." + className;
    }
}