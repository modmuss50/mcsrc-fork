package mcsrc;

import net.fabricmc.mappingio.format.proguard.ProGuardFileReader;
import net.fabricmc.tinyremapper.OutputConsumerPath;
import net.fabricmc.tinyremapper.TinyRemapper;
import net.fabricmc.tinyremapper.TinyUtils;
import org.objectweb.asm.ClassReader;
import org.objectweb.asm.ClassVisitor;
import org.objectweb.asm.ClassWriter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;

public class Remapper {
    public static byte[] remapJar(byte[] jarBytes, String mappings) throws IOException {
        Path input = Path.of("input.jar");
        Path output = Path.of("output.jar");

        Files.write(input, jarBytes);

        TinyRemapper remapper = null;
        try (BufferedReader mappingReader = new BufferedReader(new StringReader(mappings));
             OutputConsumerPath outputConsumer = new OutputConsumerPath.Builder(output).build()) {
            remapper = TinyRemapper.newRemapper()
                    .withMappings(out -> {
                        try {
                            ProGuardFileReader.read(mappingReader, TinyUtils.createAdapter("source", "target", out));
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .build();


            remapper.readInputs(input);
            remapper.apply(outputConsumer);
        } finally {
            if (remapper != null) {
                remapper.finish();
            }
        }

        byte[] out = Files.readAllBytes(output);
        Files.delete(output);
        return out;
    }


    public static byte[] remap(String name, byte[] in, String mappings) {
        TinyRemapper remapper = null;
        try (BufferedReader mappingReader = new BufferedReader(new StringReader(mappings))) {
            remapper = TinyRemapper.newRemapper()
                    .withMappings(out -> {
                        try {
                            ProGuardFileReader.read(mappingReader, TinyUtils.createAdapter("source", "target", out));
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .build();

            ClassReader reader = new ClassReader(in);
            ClassWriter writer = new ClassWriter(0);

            ClassVisitor classVisitor = remapper.getEnvironment().createClassVisitor(name, writer);
            reader.accept(classVisitor, 0);

            return writer.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException(e);
        } finally {
            if (remapper != null) {
                remapper.finish();
            }
        }
    }
}
