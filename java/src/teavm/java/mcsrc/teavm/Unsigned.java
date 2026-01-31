package mcsrc.teavm;

import static java.lang.Character.digit;

public class Unsigned {
    public static int parseUnsignedInt(String s, int radix)
            throws NumberFormatException {
        if (s == null)  {
            throw new NumberFormatException("Cannot parse null string");
        }

        if (radix < Character.MIN_RADIX) {
            throw new NumberFormatException(String.format(
                    "radix %s less than Character.MIN_RADIX", radix));
        }

        if (radix > Character.MAX_RADIX) {
            throw new NumberFormatException(String.format(
                    "radix %s greater than Character.MAX_RADIX", radix));
        }

        int len = s.length();
        if (len == 0) {
            throw new NumberFormatException(s);
        }
        int i = 0;
        char firstChar = s.charAt(i++);
        if (firstChar == '-') {
            throw new NumberFormatException(String.format(
                    "Illegal leading minus sign on unsigned string %s.", s));
        }
        int digit = ~0xFF;
        if (firstChar != '+') {
            digit = digit(firstChar, radix);
        }
        if (digit >= 0 || digit == ~0xFF && len > 1) {
            int multmax = Integer.divideUnsigned(-1, radix);  // -1 is max unsigned int
            int result = digit & 0xFF;
            boolean inRange = true;
            while (i < len && (digit = digit(s.charAt(i++), radix)) >= 0
                    && (inRange = Integer.compareUnsigned(result, multmax) < 0
                    || result == multmax && digit < -radix * multmax)) {
                result = radix * result + digit;
            }
            if (inRange && i == len && digit >= 0) {
                return result;
            }
        }
        if (digit < 0) {
            throw new NumberFormatException(s);
        }
        throw new NumberFormatException(String.format(
                "String value %s exceeds range of unsigned int.", s));
    }

    public static long parseUnsignedLong(String s, int radix)
            throws NumberFormatException {
        if (s == null)  {
            throw new NumberFormatException("Cannot parse null string");
        }

        if (radix < Character.MIN_RADIX) {
            throw new NumberFormatException(String.format(
                    "radix %s less than Character.MIN_RADIX", radix));
        }

        if (radix > Character.MAX_RADIX) {
            throw new NumberFormatException(String.format(
                    "radix %s greater than Character.MAX_RADIX", radix));
        }

        int len = s.length();
        if (len == 0) {
            throw new NumberFormatException(s);
        }
        int i = 0;
        char firstChar = s.charAt(i++);
        if (firstChar == '-') {
            throw new NumberFormatException(String.format(
                    "Illegal leading minus sign on unsigned string %s.", s));
        }
        int digit = ~0xFF;
        if (firstChar != '+') {
            digit = digit(firstChar, radix);
        }
        if (digit >= 0 || digit == ~0xFF && len > 1) {
            long multmax = Long.divideUnsigned(-1L, radix);  // -1L is max unsigned long
            long result = digit & 0xFF;
            boolean inRange = true;
            while (i < len && (digit = digit(s.charAt(i++), radix)) >= 0
                    && (inRange = Long.compareUnsigned(result, multmax) < 0
                    || result == multmax && digit < (int) (-radix * multmax))) {
                result = radix * result + digit;
            }
            if (inRange && i == len && digit >= 0) {
                return result;
            }
        }
        if (digit < 0) {
            throw new NumberFormatException(s);
        }
        throw new NumberFormatException(String.format(
                "String value %s exceeds range of unsigned long.", s));
    }
}
