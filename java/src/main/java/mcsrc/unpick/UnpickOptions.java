package mcsrc.unpick;

import org.teavm.jso.JSBody;
import org.teavm.jso.JSObject;
import org.teavm.jso.core.JSPromise;
import org.teavm.jso.typedarrays.Uint8Array;

public interface UnpickOptions extends JSObject {
    @JSBody(params = {"name"}, script = "return this.resolveClass ? this.resolveClass(name) : Promise.resolve(null);")
    JSPromise<Uint8Array> resolveClass(String name);
}
