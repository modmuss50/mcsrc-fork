package mcsrc.teavm;

import org.teavm.model.*;
import org.teavm.model.instructions.InvokeInstruction;
import org.teavm.vm.spi.TeaVMHost;
import org.teavm.vm.spi.TeaVMPlugin;

import java.util.Map;

public class Plugin implements TeaVMPlugin, ClassHolderTransformer {
    private static final Map<String, String> MAPPED_METHODS = Map.of(
            "java.util.concurrent.ConcurrentHashMap#newKeySet", "mcsrc.teavm.KeySetView",
            "java.lang.Integer#parseUnsignedInt", "mcsrc.teavm.Unsigned",
            "java.lang.Long#parseUnsignedLong", "mcsrc.teavm.Unsigned"
    );

    @Override
    public void install(TeaVMHost host) {
        host.add(this);
    }

    @Override
    public void transformClass(ClassHolder cls, ClassHolderTransformerContext context) {
        for (final MethodHolder method : cls.getMethods()) {
            if (method.getProgram() == null) continue;

            for (final BasicBlock block : method.getProgram().getBasicBlocks()) {
                for (final Instruction insn : block) {
                    if (insn instanceof InvokeInstruction invokeInsn) {
                        MethodReference methodReference = invokeInsn.getMethod();

                        String mappedMethod = MAPPED_METHODS.get(methodReference.getClassName() + "#" + methodReference.getName());

                        if (mappedMethod != null) {
                            invokeInsn.setMethod(new MethodReference(mappedMethod, methodReference.getName(), methodReference.getSignature()));
                        }
                    }
                }
            }
        }
    }
}
