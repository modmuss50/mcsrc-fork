package mcsrc.unpick;

import daomephsta.unpick.api.ConstantUninliner;
import daomephsta.unpick.api.classresolvers.IClassResolver;
import daomephsta.unpick.api.constantgroupers.ConstantGroupers;
import org.objectweb.asm.ClassReader;
import org.objectweb.asm.ClassWriter;
import org.objectweb.asm.tree.ClassNode;
import org.teavm.jso.core.JSObjects;
import org.teavm.jso.typedarrays.Int8Array;
import org.teavm.jso.typedarrays.Uint8Array;

import java.io.IOException;
import java.io.StringReader;
import java.util.logging.Logger;

public class UnpickHelper {
    private static final Logger JAVA_LOGGER = Logger.getLogger("unpick");

    public static Int8Array unpick(String className, String definition, UnpickOptions options) {
        IClassResolver classResolver = internalName -> {
            Uint8Array array = options.resolveClass(internalName).await();

            if (JSObjects.isUndefined(array)) {
                return null;
            }

            byte[] data = new Int8Array(array).copyToJavaArray();

            ClassReader classReader = new ClassReader(data);
            ClassNode classNode = new ClassNode();
            classReader.accept(classNode, ClassReader.SKIP_DEBUG);
            return classNode;
        };

        ClassNode classNode = classResolver.resolveClass(className);

        if (classNode == null) {
            System.out.println("Could not resolve target class: " + className);
            throw new RuntimeException("Could not resolve target class: " + className);
        }

        try (StringReader definitionReader = new StringReader(definition)) {
            ConstantUninliner uninliner = ConstantUninliner.builder()
                    .logger(JAVA_LOGGER)
                    .classResolver(classResolver)
                    .grouper(ConstantGroupers.dataDriven()
                            .logger(JAVA_LOGGER)
                            .lenient(false)
                            .classResolver(classResolver)
                            .mappingSource(definitionReader)
                            .build())
                    .build();

            uninliner.transform(classNode);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        ClassWriter writer = new ClassWriter(ClassWriter.COMPUTE_MAXS);
        classNode.accept(writer);
        return Int8Array.copyFromJavaArray(writer.toByteArray());
    }
}
