export class Gauntlet {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GauntletFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gauntlet_free(ptr, 0);
    }
    /**
     * Identify a ROM and start booting its game. Returns the game (1-3), or 0 if it
     * isn't one of the three USA ROMs the gauntlet uses.
     * @param {Uint8Array} data
     * @returns {number}
     */
    add_rom(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.gauntlet_add_rom(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @returns {number}
     */
    audio_len() {
        const ret = wasm.gauntlet_audio_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * This frame's sound, interleaved stereo i16 at 32 kHz.
     * @returns {number}
     */
    audio_ptr() {
        const ret = wasm.gauntlet_audio_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    height() {
        const ret = wasm.gauntlet_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * A stage is on screen (rather than a menu or card).
     * @returns {boolean}
     */
    in_game() {
        const ret = wasm.gauntlet_in_game(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Damage doesn't hurt (switched on the menu; the page remembers it).
     * @returns {boolean}
     */
    invincible() {
        const ret = wasm.gauntlet_invincible(this.__wbg_ptr);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.gauntlet_new();
        this.__wbg_ptr = ret;
        GauntletFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {boolean}
     */
    paused() {
        const ret = wasm.gauntlet_paused(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * The screen as RGBA bytes (`width() * height() * 4`), valid until the next call.
     * @returns {number}
     */
    rgba_ptr() {
        const ret = wasm.gauntlet_rgba_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {boolean} on
     */
    set_invincible(on) {
        wasm.gauntlet_set_invincible(this.__wbg_ptr, on);
    }
    /**
     * Run one displayed frame. `pad` is the SNES buttons held, `flags` the bits
     * above; `tap_x`/`tap_y` a tap on the screen in screen pixels (-1 if none).
     * Background work (booting, starting a level) may use up to `budget_ms`.
     * @param {number} pad
     * @param {number} flags
     * @param {number} tap_x
     * @param {number} tap_y
     * @param {number} budget_ms
     */
    tick(pad, flags, tap_x, tap_y, budget_ms) {
        wasm.gauntlet_tick(this.__wbg_ptr, pad, flags, tap_x, tap_y, budget_ms);
    }
    /**
     * @returns {number}
     */
    width() {
        const ret = wasm.gauntlet_width(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) Gauntlet.prototype[Symbol.dispose] = Gauntlet.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_now_f3b3cf41f1fe5d16: function() {
            const ret = performance.now();
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./dkc_web_bg.js": import0,
    };
}

const GauntletFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gauntlet_free(ptr, 1));

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('dkc_web_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
