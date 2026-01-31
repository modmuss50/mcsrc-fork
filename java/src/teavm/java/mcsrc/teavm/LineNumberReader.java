package mcsrc.teavm;

import java.io.BufferedReader;
import java.io.Reader;

public class LineNumberReader extends BufferedReader {
    public LineNumberReader(Reader in) {
        super(in);
    }

    public int getLineNumber() {
        return -1;
    }
}
