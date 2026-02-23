package mcsrc.teavm.mappedClasses;

public class TypeNotPresentException extends RuntimeException {
    public TypeNotPresentException(String typeName, Throwable cause) {
        super("Type " + typeName + " not present", cause);
    }
}
