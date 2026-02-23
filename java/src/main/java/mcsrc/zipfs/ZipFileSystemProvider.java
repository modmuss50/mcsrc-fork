package mcsrc.zipfs;

import org.teavm.classlib.java.net.TURI;
import org.teavm.classlib.java.nio.file.*;
import org.teavm.classlib.java.nio.file.attribute.TBasicFileAttributes;
import org.teavm.classlib.java.nio.file.attribute.TFileAttribute;
import org.teavm.classlib.java.nio.file.spi.TFileSystemProvider;

import java.io.IOException;
import java.util.Map;

public class ZipFileSystemProvider extends TFileSystemProvider {
    @Override
    public String getScheme() {
        return "jar";
    }

    @Override
    public TFileSystem newFileSystem(TURI uri, Map<String, ?> env) throws IOException {
        throw new IllegalStateException();
    }

    @Override
    public TFileSystem getFileSystem(TURI uri) {
        throw new IllegalStateException();
    }

    @Override
    public TPath getPath(TURI uri) {
        throw new IllegalStateException();
    }

    @Override
    public TFileSystem newFileSystem(TPath path, Map<String, ?> env) throws IOException {
        throw new IllegalStateException();
    }

    @Override
    public TDirectoryStream<TPath> newDirectoryStream(TPath dir, TDirectoryStream.Filter<? super TPath> filter) throws IOException {
        throw new IllegalStateException();
    }

    @Override
    public void createDirectory(TPath dir, TFileAttribute<?>... attrs) throws IOException {

    }

    @Override
    public void delete(TPath path) throws IOException {

    }

    @Override
    public void copy(TPath source, TPath target, TCopyOption... options) throws IOException {

    }

    @Override
    public void move(TPath source, TPath target, TCopyOption... options) throws IOException {

    }

    @Override
    public boolean isSameFile(TPath path, TPath path2) throws IOException {
        return false;
    }

    @Override
    public boolean isHidden(TPath path) throws IOException {
        return false;
    }

    @Override
    public void checkAccess(TPath path, TAccessMode... modes) throws IOException {

    }

    @Override
    public <A extends TBasicFileAttributes> A readAttributes(TPath path, Class<A> type, TLinkOption... options) throws IOException {
        return null;
    }
}
