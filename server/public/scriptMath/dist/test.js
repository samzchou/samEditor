!function(e, t) {
    "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define([ "exports" ], t) : t(e.MyScript = {});
}(this, function(e) {
    "use strict";
    var l = {
        EventType: {
            IDLE: "idle",
            CHANGED: "changed",
            IMPORTED: "imported",
            EXPORTED: "exported",
            CONVERTED: "converted",
            RENDERED: "rendered",
            LOADED: "loaded",
            UNDO: "undo",
            REDO: "redo",
            CLEAR: "clear",
            IMPORT: "import",
            SUPPORTED_IMPORT_MIMETYPES: "supportedImportMimeTypes",
            EXPORT: "export",
            CONVERT: "convert",
            ERROR: "error"
        },
        RecognitionType: {
            TEXT: "TEXT",
            MATH: "MATH",
            SHAPE: "SHAPE",
            MUSIC: "MUSIC",
            ANALYZER: "ANALYZER",
            DIAGRAM: "DIAGRAM",
            NEBO: "NEBO",
            RAWCONTENT: "Raw Content"
        },
        Protocol: {
            WEBSOCKET: "WEBSOCKET",
            REST: "REST"
        },
        ModelState: {
            INITIALIZING: "INITIALIZING",
            INITIALIZED: "INITIALIZED",
            EXPORTING: "EXPORTING",
            EXPORTED: "EXPORTED",
            PENDING: "PENDING",
            MODIFIED: "MODIFIED",
            ERROR: "ERROR"
        },
        Trigger: {
            QUIET_PERIOD: "QUIET_PERIOD",
            POINTER_UP: "POINTER_UP",
            DEMAND: "DEMAND"
        },
        Logger: {
            EDITOR: "editor",
            MODEL: "model",
            GRABBER: "grabber",
            RENDERER: "renderer",
            RECOGNIZER: "recognizer",
            CALLBACK: "callback",
            UTIL: "util",
            SMARTGUIDE: "smartguide"
        },
        LogLevel: {
            TRACE: "TRACE",
            DEBUG: "DEBUG",
            INFO: "INFO",
            WARN: "WARN",
            ERROR: "ERROR"
        },
        Languages: {
            zh_CN: "Noto Sans CJK tc",
            zh_HK: "Noto Sans CJK tc",
            zh_TW: "Noto Sans CJK tc",
            ko_KR: "Noto Sans CJK kr",
            ja_JP: "Noto Sans CJK jp",
            hy_AM: "Noto Sans Armenian",
            default: "Open Sans"
        },
        Error: {
            NOT_REACHABLE: "MyScript recognition server is not reachable. Please reload once you are connected.",
            WRONG_CREDENTIALS: "Application credentials are invalid. Please check or regenerate your application key and hmackey.",
            TOO_OLD: "Session is too old. Max Session Duration Reached."
        },
        Exports: {
            JIIX: "application/vnd.myscript.jiix"
        }
    }, i = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
    function N(e) {
        return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
    }
    function t(e, t) {
        return e(t = {
            exports: {}
        }, t.exports), t.exports;
    }
    var n = (0, t(function(e) {
        var t, n;
        t = i, n = function() {
            var i = function() {}, c = "undefined", l = [ "trace", "debug", "info", "warn", "error" ];
            function r(e, t) {
                var n = e[t];
                if ("function" == typeof n.bind) return n.bind(e);
                try {
                    return Function.prototype.bind.call(n, e);
                } catch (t) {
                    return function() {
                        return Function.prototype.apply.apply(n, [ e, arguments ]);
                    };
                }
            }
            function u(e, t) {
                for (var n = 0; n < l.length; n++) {
                    var r = l[n];
                    this[r] = n < e ? i : this.methodFactory(r, e, t);
                }
                this.log = this.debug;
            }
            function d(e, t, n) {
                return function(e) {
                    return "debug" === e && (e = "log"), typeof console !== c && (void 0 !== console[e] ? r(console, e) : void 0 !== console.log ? r(console, "log") : i);
                }(e) || function(e, t, n) {
                    return function() {
                        typeof console !== c && (u.call(this, t, n), this[e].apply(this, arguments));
                    };
                }.apply(this, arguments);
            }
            function n(n, e, t) {
                var r, i = this, o = "loglevel";
                function a() {
                    var e;
                    if (typeof window !== c) {
                        try {
                            e = window.localStorage[o];
                        } catch (e) {}
                        if (typeof e === c) try {
                            var t = window.document.cookie, n = t.indexOf(encodeURIComponent(o) + "=");
                            -1 !== n && (e = /^([^;]+)/.exec(t.slice(n))[1]);
                        } catch (e) {}
                        return void 0 === i.levels[e] && (e = void 0), e;
                    }
                }
                n && (o += ":" + n), i.name = n, i.levels = {
                    TRACE: 0,
                    DEBUG: 1,
                    INFO: 2,
                    WARN: 3,
                    ERROR: 4,
                    SILENT: 5
                }, i.methodFactory = t || d, i.getLevel = function() {
                    return r;
                }, i.setLevel = function(e, t) {
                    if ("string" == typeof e && void 0 !== i.levels[e.toUpperCase()] && (e = i.levels[e.toUpperCase()]), 
                    !("number" == typeof e && e >= 0 && e <= i.levels.SILENT)) throw "log.setLevel() called with invalid level: " + e;
                    if (r = e, !1 !== t && function(e) {
                        var t = (l[e] || "silent").toUpperCase();
                        if (typeof window !== c) {
                            try {
                                return void (window.localStorage[o] = t);
                            } catch (e) {}
                            try {
                                window.document.cookie = encodeURIComponent(o) + "=" + t + ";";
                            } catch (e) {}
                        }
                    }(e), u.call(i, e, n), typeof console === c && e < i.levels.SILENT) return "No console available for logging";
                }, i.setDefaultLevel = function(e) {
                    a() || i.setLevel(e, !1);
                }, i.enableAll = function(e) {
                    i.setLevel(i.levels.TRACE, e);
                }, i.disableAll = function(e) {
                    i.setLevel(i.levels.SILENT, e);
                };
                var s = a();
                null == s && (s = null == e ? "WARN" : e), i.setLevel(s, !1);
            }
            var o = new n(), a = {};
            o.getLogger = function(e) {
                if ("string" != typeof e || "" === e) throw new TypeError("You must supply a name when creating a logger.");
                var t = a[e];
                return t || (t = a[e] = new n(e, o.getLevel(), o.methodFactory)), 
                t;
            };
            var e = typeof window !== c ? window.log : void 0;
            return o.noConflict = function() {
                return typeof window !== c && window.log === o && (window.log = e), 
                o;
            }, o.getLoggers = function() {
                return a;
            }, o;
        }, e.exports ? e.exports = n() : t.log = n();
    }).noConflict)(), u = n.getLogger(l.Logger.EDITOR);
    u.setDefaultLevel(l.LogLevel.ERROR);
    n.getLogger(l.Logger.SMARTGUIDE);
    u.setDefaultLevel(l.LogLevel.ERROR);
    var d = n.getLogger(l.Logger.MODEL);
    d.setDefaultLevel(l.LogLevel.ERROR);
    var H = n.getLogger(l.Logger.GRABBER);
    H.setDefaultLevel(l.LogLevel.ERROR);
    var f = n.getLogger(l.Logger.RENDERER);
    f.setDefaultLevel(l.LogLevel.ERROR);
    var c = n.getLogger(l.Logger.RECOGNIZER);
    c.setDefaultLevel(l.LogLevel.ERROR);
    var U = n.getLogger(l.Logger.CALLBACK);
    U.setDefaultLevel(l.LogLevel.ERROR);
    var X = n.getLogger(l.Logger.UTIL);
    X.setDefaultLevel(l.LogLevel.ERROR), n.getLogger("test").setDefaultLevel(l.LogLevel.ERROR);
    var j = function(e) {
        return null == e || "function" != typeof e && "object" != typeof e;
    }, B = function(e, t) {
        if (null === e || void 0 === e) throw new TypeError("expected first argument to be an object.");
        if (void 0 === t || "undefined" == typeof Symbol) return e;
        if ("function" != typeof Object.getOwnPropertySymbols) return e;
        for (var n = Object.prototype.propertyIsEnumerable, r = Object(e), i = arguments.length, o = 0; ++o < i; ) for (var a = Object(arguments[o]), s = Object.getOwnPropertySymbols(a), c = 0; c < s.length; c++) {
            var l = s[c];
            n.call(a, l) && (r[l] = a[l]);
        }
        return r;
    }, W = Object.prototype.toString, Y = function(e) {
        var t = typeof e;
        return "undefined" === t ? "undefined" : null === e ? "null" : !0 === e || !1 === e || e instanceof Boolean ? "boolean" : "string" === t || e instanceof String ? "string" : "number" === t || e instanceof Number ? "number" : "function" === t || e instanceof Function ? void 0 !== e.constructor.name && "Generator" === e.constructor.name.slice(0, 9) ? "generatorfunction" : "function" : void 0 !== Array.isArray && Array.isArray(e) ? "array" : e instanceof RegExp ? "regexp" : e instanceof Date ? "date" : "[object RegExp]" === (t = W.call(e)) ? "regexp" : "[object Date]" === t ? "date" : "[object Arguments]" === t ? "arguments" : "[object Error]" === t ? "error" : "[object Promise]" === t ? "promise" : function(e) {
            return e.constructor && "function" == typeof e.constructor.isBuffer && e.constructor.isBuffer(e);
        }(e) ? "buffer" : "[object Set]" === t ? "set" : "[object WeakSet]" === t ? "weakset" : "[object Map]" === t ? "map" : "[object WeakMap]" === t ? "weakmap" : "[object Symbol]" === t ? "symbol" : "[object Map Iterator]" === t ? "mapiterator" : "[object Set Iterator]" === t ? "setiterator" : "[object String Iterator]" === t ? "stringiterator" : "[object Array Iterator]" === t ? "arrayiterator" : "[object Int8Array]" === t ? "int8array" : "[object Uint8Array]" === t ? "uint8array" : "[object Uint8ClampedArray]" === t ? "uint8clampedarray" : "[object Int16Array]" === t ? "int16array" : "[object Uint16Array]" === t ? "uint16array" : "[object Int32Array]" === t ? "int32array" : "[object Uint32Array]" === t ? "uint32array" : "[object Float32Array]" === t ? "float32array" : "[object Float64Array]" === t ? "float64array" : "object";
    };
    function G(e) {
        e = e || {};
        var t = arguments.length, n = 0;
        if (1 === t) return e;
        for (;++n < t; ) {
            var r = arguments[n];
            j(e) && (e = r), K(r) && F(e, r);
        }
        return e;
    }
    function F(e, t) {
        for (var n in B(e, t), t) if ("__proto__" !== n && V(t, n)) {
            var r = t[n];
            K(r) ? ("undefined" === Y(e[n]) && "function" === Y(r) && (e[n] = r), 
            e[n] = G(e[n] || {}, r)) : e[n] = r;
        }
        return e;
    }
    function K(e) {
        return "object" === Y(e) || "function" === Y(e);
    }
    function V(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
    }
    var J = G, q = {
        recognitionParams: {
            type: "TEXT",
            protocol: "WEBSOCKET",
            apiVersion: "V4",
            server: {
                scheme: "https",
                host: "cloud.myscript.com",
                applicationKey: void 0,
                hmacKey: void 0,
                useWindowLocation: !1,
                websocket: {
                    pingEnabled: !0,
                    pingDelay: 3e4,
                    maxPingLostCount: 10,
                    autoReconnect: !0,
                    maxRetryCount: 2,
                    fileChunkSize: 3e5
                }
            },
            v4: {
                alwaysConnected: !0,
                lang: "en_US",
                export: {
                    "image-resolution": 300,
                    jiix: {
                        "bounding-box": !1,
                        strokes: !1,
                        text: {
                            chars: !1,
                            words: !0
                        }
                    }
                },
                renderer: {
                    debug: {
                        "draw-text-boxes": !1,
                        "draw-image-boxes": !1
                    }
                },
                math: {
                    mimeTypes: [ "application/x-latex", "application/mathml+xml" ],
                    solver: {
                        enable: !0,
                        "fractional-part-digits": 3,
                        "decimal-separator": ".",
                        "rounding-mode": "half up",
                        "angle-unit": "deg"
                    },
                    margin: {
                        bottom: 10,
                        left: 15,
                        right: 15,
                        top: 10
                    }
                },
                text: {
                    guides: {
                        enable: !0
                    },
                    smartGuide: !0,
                    smartGuideFadeOut: {
                        enable: !1,
                        duration: 1e4
                    },
                    mimeTypes: [ "text/plain", "application/vnd.myscript.jiix" ],
                    margin: {
                        top: 20,
                        left: 10,
                        right: 10
                    }
                },
                diagram: {
                    mimeTypes: [ "application/vnd.myscript.jiix" ],
                    margin: {
                        bottom: 10,
                        left: 15,
                        right: 15,
                        top: 10
                    }
                },
                "raw-content": {
                    recognition: {
                        text: !1,
                        shape: !1
                    }
                }
            },
            v3: {
                mathParameter: {
                    resultTypes: [ "LATEX", "MATHML" ],
                    columnarOperation: !1,
                    userResources: [],
                    scratchOutDetectionSensitivity: 1
                },
                textParameter: {
                    language: "en_US",
                    textInputMode: "CURSIVE",
                    resultDetail: "TEXT",
                    contentTypes: [],
                    subsetKnowledges: [],
                    userLkWords: [],
                    userResources: [],
                    textProperties: {
                        textCandidateListSize: 1,
                        wordCandidateListSize: void 0,
                        wordPredictionListSize: 0,
                        wordCompletionListSize: 0,
                        characterCandidateListSize: void 0,
                        enableOutOfLexicon: !1,
                        discardCaseVariations: !1,
                        discardAccentuationVariations: !1,
                        glyphDistortion: void 0,
                        enableTagger: !1,
                        spellingDistortion: void 0
                    }
                },
                shapeParameter: {
                    userResources: void 0,
                    rejectDetectionSensitivity: 1,
                    doBeautification: !0
                },
                musicParameter: {
                    divisions: 480,
                    resultTypes: [ "MUSICXML", "SCORETREE" ],
                    userResources: [],
                    staff: {
                        top: 100,
                        count: 5,
                        gap: 20
                    },
                    clef: {
                        symbol: "G",
                        octave: 0,
                        line: 2
                    },
                    scratchOutDetectionSensitivity: 1
                },
                analyzerParameter: {
                    textParameter: {
                        textProperties: {},
                        language: "en_US",
                        textInputMode: "CURSIVE"
                    },
                    coordinateResolution: void 0
                }
            }
        },
        listenerOptions: {
            capture: !1,
            passive: !0
        },
        undoRedoMaxStackSize: 20,
        xyFloatPrecision: 0,
        timestampFloatPrecision: 0,
        triggerDelay: 2e3,
        processDelay: 0,
        resizeTriggerDelay: 200,
        triggers: {
            exportContent: "POINTER_UP",
            addStrokes: "POINTER_UP"
        },
        restConversionState: "",
        renderingParams: {
            stroker: "quadratic",
            minHeight: 100,
            minWidth: 100
        }
    };
    function Z(e) {
        var t = e, n = void 0;
        return t && t.recognitionParams.server && t.recognitionParams.server.useWindowLocation ? (t.recognitionParams.server.scheme = window.location.protocol.slice(0, -1), 
        t.recognitionParams.server.host = window.location.host, n = J({}, q, void 0 === t ? {} : t)) : n = J({}, q, void 0 === e ? {} : e), 
        u.debug("Override default configuration", n), n;
    }
    var Q = t(function(e, t) {
        e.exports = function(n) {
            function r(e) {
                if (i[e]) return i[e].exports;
                var t = i[e] = {
                    i: e,
                    l: !1,
                    exports: {}
                };
                return n[e].call(t.exports, t, t.exports, r), t.l = !0, t.exports;
            }
            var i = {};
            return r.m = n, r.c = i, r.i = function(e) {
                return e;
            }, r.d = function(e, t, n) {
                r.o(e, t) || Object.defineProperty(e, t, {
                    configurable: !1,
                    enumerable: !0,
                    get: n
                });
            }, r.n = function(e) {
                var t = e && e.__esModule ? function() {
                    return e.default;
                } : function() {
                    return e;
                };
                return r.d(t, "a", t), t;
            }, r.o = function(e, t) {
                return Object.prototype.hasOwnProperty.call(e, t);
            }, r.p = "", r(r.s = 1);
        }([ function(e, t, n) {
            Object.defineProperty(t, "__esModule", {
                value: !0
            });
            var a = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
                return typeof e;
            } : function(e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
            };
            t.default = function e(t) {
                var o = this;
                (function(e, t) {
                    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
                })(this, e), this.toJSON = function(e) {
                    if ("string" != typeof e) return console.error("Need a CSS string but given ", void 0 === e ? "undefined" : a(e), e), 
                    "Not a valid CSS..!";
                    var t = {}, n = void 0, r = void 0, i = void 0;
                    try {
                        e.split("{").forEach(function(e) {
                            if (r = e.trim()) if (-1 === r.indexOf("}")) t[r] = {}, 
                            n = r; else {
                                r.substring(0, r.indexOf("}")).split(";").forEach(function(e) {
                                    (i = e.split(":")) && 2 === i.length && (t[n][i[0].trim().replace(/^\"|\"$/g, "")] = o._trimSemiColon(i[1].trim().replace(/^\"|\"$/g, "")));
                                });
                                try {
                                    (n = r.split("}")[1].trim()) && (t[n] = {});
                                } catch (e) {}
                            }
                        });
                    } catch (e) {
                        return "Not a valid CSS..!";
                    }
                    return t;
                }, this.toCSS = function(e) {
                    if ("object" !== (void 0 === e ? "undefined" : a(e))) return console.error("Need a JSON object but given ", void 0 === e ? "undefined" : a(e), e), 
                    "Not a valid JSON..!";
                    var t = "";
                    try {
                        for (var n in e) if (e.hasOwnProperty(n)) {
                            for (var r in t += n + " {\n", e[n]) e[n].hasOwnProperty(r) && (t += r + ": " + e[n][r] + ";\n");
                            t += "}\n";
                        }
                    } catch (e) {
                        return "Not a valid JSON..!";
                    }
                    return t;
                }, this._trimSemiColon = function(e) {
                    return ";" === e.slice(-1) ? e.slice(0, o.length - 1) : e;
                };
            };
        }, function(e, t, n) {
            e.exports = n(0).default;
        } ]);
    }), $ = N(Q), ee = (Q.JsonCSS, void 0), te = new $();
    function ne(e) {
        var t = te.toCSS({
            css: e
        });
        return t.substring(6, t.length - 3);
    }
    var re = {
        ink: {
            color: "#000000",
            "-myscript-pen-width": 1,
            "-myscript-pen-fill-style": "none",
            "-myscript-pen-fill-color": "#FFFFFF00"
        },
        ".math": {
            "font-family": "STIXGeneral"
        },
        ".math-solved": {
            "font-family": "STIXGeneral",
            color: "#A8A8A8FF"
        },
        ".text": {
            "font-family": "Open Sans",
            "font-size": 10
        }
    }, ie = new $();
    function oe(e) {
        return ie.toCSS(e);
    }
    var ae = [ 1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9 ];
    function se(e, t) {
        if (t || 0 === t) {
            var n = void 0;
            return n = t > 10 ? ae[10] : ae[t], Math.round(e * n) / n;
        }
        return e;
    }
    function ce(e, t, n) {
        var r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 0, i = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : 0, o = e;
        o.changedTouches && (o = o.changedTouches[0]);
        var a = t.getBoundingClientRect();
        return {
            x: se(o.clientX - a.left - t.clientLeft - i, n.xyFloatPrecision),
            y: se(o.clientY - a.top - t.clientTop - r, n.xyFloatPrecision),
            t: se(Date.now(), n.timestampFloatPrecision)
        };
    }
    var le = Object.freeze({
        attach: function(a, s) {
            var c = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0, l = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 0, u = 0;
            function o() {
                "None" !== window.getSelection().type && window.getSelection().removeAllRanges();
            }
            function r(e) {
                var t = document.querySelector(".more-menu");
                return !(e.target.classList.contains("ellipsis") || e.target.classList.contains("more-menu") || e.target.classList.contains("options-label-button") || !t || "none" === t.style.display || (t.style.display = "none", 
                0));
            }
            function i(e) {
                var t = document.querySelector(".candidates");
                return !(e.target.classList.contains("candidates") || "SPAN" === e.target.tagName || !t || "none" === t.style.display || (t.style.display = "none", 
                0));
            }
            var n = {
                options: s.configuration.listenerOptions,
                listeners: [ {
                    types: [ "pointerdown" ],
                    listener: function(e) {
                        var t = e.target.id === s.domElement.id || e.target.classList.contains("ms-canvas");
                        if (void 0 !== this.activePointerId) this.activePointerId === e.pointerId && H.trace(e.type + " event with the same id without any pointer up", e.pointerId); else if (2 !== e.button && 2 !== e.buttons && t) {
                            if (!r(e) && !i(e)) {
                                this.activePointerId = e.pointerId;
                                var n = e.pointerId > 2147483647 ? -1 : e.pointerId;
                                o(), e.stopPropagation(), s.pointerDown(ce(e, a, s.configuration, c, l), e.pointerType, n);
                            }
                        } else e.target.classList.contains("ellipsis") || e.target.classList.contains("tag-icon") ? (r(e), 
                        i(e)) : (r(e), i(e), this.smartGuidePointerDown = !0, this.downSmartGuidePoint = ce(e, a, s.configuration));
                    }
                }, {
                    types: [ "pointermove" ],
                    listener: function(e) {
                        if (void 0 !== this.activePointerId && this.activePointerId === e.pointerId) o(), 
                        s.pointerMove(ce(e, a, s.configuration, c, l)); else if (this.smartGuidePointerDown) {
                            var t = ce(e, a, s.configuration, c, l), n = Math.abs(this.downSmartGuidePoint.x - t.x), r = Math.abs(this.downSmartGuidePoint.y - t.y);
                            if (u = Math.max(n, u), n < 5 && r > 5 && u < 15 || n > 5 && r > 5 && u < 15) {
                                this.activePointerId = e.pointerId;
                                var i = e.pointerId > 2147483647 ? -1 : e.pointerId;
                                o(), s.pointerDown(this.downSmartGuidePoint, e.pointerType, i);
                            }
                        } else H.trace(e.type + " event from another pointerid (" + e.pointerId + ")", this.activePointerId);
                    }
                }, {
                    types: [ "pointerup", "pointerout", "pointerleave", "pointercancel" ],
                    listener: function(e) {
                        u = 0, this.smartGuidePointerDown = !1;
                        var t = [ "smartguide", "prompter-text-container", "prompter-text", "tag-icon", "ellipsis" ], n = [ "ps__rail-x", "ps__thumb-x" ], r = e.relatedTarget && (t.includes(e.relatedTarget.className) || n.includes(e.relatedTarget.className)), i = e.relatedTarget && e.target && (t.includes(e.target.className) || n.includes(e.target.className)), o = e.relatedTarget && e.target && ("SPAN" === e.target.tagName || "SPAN" === e.relatedTarget.tagName);
                        r || i || o ? e.stopPropagation() : void 0 !== this.activePointerId && this.activePointerId === e.pointerId ? (this.activePointerId = void 0, 
                        e.stopPropagation(), s.pointerUp(ce(e, a, s.configuration, c, l))) : H.trace(e.type + " event from another pointerid (" + e.pointerId + ")", this.activePointerId);
                    }
                } ]
            };
            return H.debug("attaching listeners", n), n.listeners.forEach(function(t) {
                t.types.forEach(function(e) {
                    return a.addEventListener(e, t.listener, n.options);
                });
            }), n;
        },
        detach: function(n, r) {
            H.debug("detaching listeners", r), r.listeners.forEach(function(t) {
                t.types.forEach(function(e) {
                    return n.removeEventListener(e, t.listener, r.options);
                });
            });
        }
    });
    function ue(e, t, n) {
        n && n.drawStroke(e, t);
    }
    var de = {
        table: "table",
        shape: "shape",
        recognizedShape: "recognizedShape",
        ellipse: "ellipse",
        line: "line"
    };
    function fe(e) {
        var t = (e + Math.PI) % (2 * Math.PI) - Math.PI;
        return t < -Math.PI && (t += 2 * Math.PI), t;
    }
    function he(e, t, n, r) {
        var i = fe(n + Math.PI * (7 / 8)), o = fe(n - Math.PI * (7 / 8)), a = e;
        a.save();
        try {
            a.fillStyle = a.strokeStyle, a.moveTo(t.x, t.y), a.beginPath(), a.lineTo(t.x + r * Math.cos(i), t.y + r * Math.sin(i)), 
            a.lineTo(t.x + r * Math.cos(o), t.y + r * Math.sin(o)), a.lineTo(t.x, t.y), 
            a.fill();
        } finally {
            a.restore();
        }
    }
    function pe(e, t) {
        var n = function(e, t, n, r, i, o, a) {
            var s = Math.cos(i), c = Math.sin(i), l = s, u = c;
            s *= n, l *= r, c *= n, u *= r;
            var d = Math.floor(Math.abs(a) / .02), f = [];
            e.save();
            try {
                e.beginPath();
                for (var h = 0; h <= d; h++) {
                    var p = o + h / d * a, g = Math.atan2(Math.sin(p) / r, Math.cos(p) / n), m = Math.cos(g), v = Math.sin(g), y = t.x + s * m - u * v, b = t.y + l * v + c * m;
                    0 === h ? e.moveTo(y, b) : e.lineTo(y, b), 0 !== h && h !== d || f.push({
                        x: y,
                        y: b
                    });
                }
                e.stroke();
            } finally {
                e.restore();
            }
            return f;
        }(e, t.center, t.maxRadius, t.minRadius, t.orientation, t.startAngle, t.sweepAngle);
        t.beginDecoration && "ARROW_HEAD" === t.beginDecoration && he(e, n[0], t.beginTangentAngle, 12), 
        t.endDecoration && "ARROW_HEAD" === t.endDecoration && he(e, n[1], t.endTangentAngle, 12);
    }
    function ge(e, t, n) {
        e.save();
        try {
            e.beginPath(), e.moveTo(t.x, t.y), e.lineTo(n.x, n.y), e.stroke();
        } finally {
            e.restore();
        }
    }
    function me(e, t) {
        f.debug("draw " + t.type + " symbol");
        var n = e;
        n.save();
        try {
            if (n.lineWidth = t.width, n.strokeStyle = t.color, t.elementType) switch (t.elementType) {
              case de.shape:
                me(n, t.candidates[t.selectedCandidateIndex]);
                break;

              case de.table:
                t.lines.forEach(function(e) {
                    return me(n, e);
                });
                break;

              case de.line:
                ge(n, t.data.p1, t.data.p2);
                break;

              default:
                f.error(t.elementType + " not implemented");
            } else switch (t.type) {
              case de.ellipse:
                pe(n, t);
                break;

              case de.line:
                !function(e, t) {
                    ge(e, t.firstPoint, t.lastPoint), "ARROW_HEAD" === t.beginDecoration && he(e, t.firstPoint, t.beginTangentAngle, 12), 
                    "ARROW_HEAD" === t.endDecoration && he(e, t.lastPoint, t.endTangentAngle, 12);
                }(n, t);
                break;

              case de.recognizedShape:
                t.primitives.forEach(function(e) {
                    return me(n, e);
                });
                break;

              default:
                f.error(t.type + " not implemented");
            }
        } finally {
            n.restore();
        }
    }
    var ve = {
        inputCharacter: "inputCharacter",
        char: "char",
        string: "string",
        textLine: "textLine"
    };
    function ye(t, n) {
        !function(e, t, n) {
            var r = e;
            r.save();
            try {
                r.font = n.textHeight + "px serif", r.textAlign = "CENTER" === n.justificationType ? "center" : "left", 
                r.textBaseline = "bottom", r.fillStyle = r.strokeStyle, r.fillText(t, n.topLeftPoint.x, n.topLeftPoint.y + n.height);
            } finally {
                r.restore();
            }
        }(t, n.label, n.data), n.underlineList.forEach(function(e) {
            !function(e, t, n, r) {
                var i = r.width / n.length;
                ge(e, {
                    x: r.topLeftPoint.x + t.data.firstCharacter * i,
                    y: r.topLeftPoint.y + r.height
                }, {
                    x: r.topLeftPoint.x + t.data.lastCharacter * i,
                    y: r.topLeftPoint.y + r.height
                });
            }(t, e, n.label, n.data);
        });
    }
    var be = {
        F: {
            svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="18" height="20"><g transform="translate(6.600000e-3,3.125356e-3)"><path d="M17.3 3.1 C17.3 3.5 17.1 3.8 16.8 4.1 C16.5 4.4 15.9 4.5 15.5 4.3 C15 4.1 14.7 3.7 14.7 3.2 C14.6 2.8 14.8 2.5 15 2.2 C15.3 1.9 15.7 1.8 16 1.8 C16.4 1.8 16.8 2 17 2.3 C17.2 2.5 17.3 2.8 17.3 3.1 z"/><path d="M17.3 8.9 C17.3 9.3 17.1 9.7 16.8 9.9 C16.5 10.3 15.9 10.3 15.5 10.2 C15 10 14.7 9.5 14.7 9.1 C14.6 8.7 14.8 8.3 15 8 C15.3 7.8 15.7 7.6 16 7.6 C16.5 7.7 17 8 17.2 8.4 C17.2 8.6 17.3 8.8 17.3 8.9 z"/><path d="M13 7.2 C13 10 11.8 12.7 9.8 14.7 C7.3 17.2 4 18.8 0.7 19.8 C0.3 20.1 -0.4 19.8 0.3 19.4 C1.6 18.8 3 18.3 4.2 17.5 C7 15.8 9.3 13.1 9.8 9.9 C10.1 8 10.1 5.9 9.6 4 C9.2 2.6 8.2 1.1 6.7 0.9 C5.3 0.7 3.7 1.2 2.7 2.2 C2.5 2.4 2 3.2 2 4 C2.6 3.6 2.6 3.6 3.1 3.4 C4.2 2.9 5.7 3.6 6 4.9 C6.3 6 6.1 7.5 5 8.1 C3.8 8.7 2 8.5 1.4 7.2 C0.3 5.3 0.9 2.6 2.6 1.2 C4.4 -0.3 7.1 -0.3 9.2 0.4 C11.4 1.3 12.7 3.5 12.9 5.8 C13 6.2 13 6.7 13 7.2 z"/></g></svg>',
            getBoundingBox: function(e, t, n) {
                return {
                    height: 3 * e,
                    width: 3 * e * .9,
                    x: t,
                    y: n - e
                };
            }
        },
        C: {
            svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="18" height="25"><g transform="matrix(1,0,0,1.030698,-309.364,-543.8647)"><path d="M 325.9 546.8 C 325.8 548.7 324.7 550.7 322.8 551.5 C 321.1 552.1 319.1 552.2 317.6 551 C 316.6 550.2 316.2 548.4 317.3 547.5 C 318.3 546.5 320.4 547.4 320.3 548.9 C 320.7 549.9 318.5 550.5 319.7 551.3 C 321 551.6 322.3 550.5 322.6 549.3 C 323.1 547.5 323.1 545.6 322.7 543.8 C 322.4 542.9 321.9 541.5 320.7 541.9 C 319.2 542.2 318.3 543.8 317.9 545.1 C 317.6 543.2 316.4 541.5 315 540.2 C 315 544.1 315 548 315 551.9 L 314.1 551.9 C 314.1 543.9 314.1 535.7 314.1 527.7 L 315 527.7 C 315 531.5 315 535.5 315 539.4 C 316.4 538.1 317.6 536.4 317.8 534.5 C 318.3 535.9 319.3 537.5 321 537.8 C 322.2 537.8 322.5 536.3 322.8 535.4 C 323.1 533.7 323.1 531.8 322.6 530.1 C 322.2 529 320.9 528 319.6 528.3 C 318.6 529 320.6 529.6 320.3 530.6 C 320.5 532 318.8 533 317.6 532.3 C 316.3 531.6 316.4 529.7 317.4 528.8 C 318 528.1 319.3 527.7 320.3 527.7 C 321.2 527.7 321.8 527.7 322.6 528 C 324.6 528.7 325.7 530.7 325.9 532.7 C 326.2 534.9 324.9 537.3 322.8 538.2 C 321.5 538.7 319.9 538.3 318.8 537.3 C 318.7 538.3 318.2 539.2 317.7 539.9 C 318.1 540.6 318.6 541.8 318.8 542.1 C 320.1 540.9 322.5 540.8 323.8 542 C 325.2 543.1 326.1 545 325.9 546.8 z "/></g><g transform="matrix(1,0,0,1.030928,-309.364,-543.9805)"><path d="M 312.2 551.9 L 309.4 551.9 L 309.4 527.7 L 312.2 527.7 L 312.2 551.9 z "/></g></svg>',
            getBoundingBox: function(e, t, n) {
                return {
                    height: 3 * e,
                    width: 3 * e * .72,
                    x: t,
                    y: n - 1.5 * e
                };
            }
        },
        G: {
            svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="15" height="40"><g><path d="m 12 3.4 c 0.3 3.1 -2 5.6 -4.1 7.6 -0.9 0.9 -0.2 0.1 -0.6 0.6 -0.1 -0.5 -0.3 -1.7 -0.3 -2.1 0.1 -2.6 2.3 -6.5 4.2 -7.9 0.3 0.6 0.6 0.6 0.8 1.8 z m 0.7 15.9 c -1.2 -0.9 -2.8 -1.1 -4.3 -0.9 -0.2 -1.2 -0.4 -2.5 -0.6 -3.7 2.4 -2.3 4.9 -4.9 5 -8.4 0.1 -2.2 -0.3 -4.6 -1.7 -6.4 C 9.5 0.1 8.3 2.1 7.4 3.3 c -1.5 2.6 -1.1 5.8 -0.6 8.6 -0.8 0.9 -1.9 1.7 -2.7 2.7 -2.4 2.3 -4.4 5.3 -4 8.7 0.2 3.3 2.6 6.3 5.9 7.1 1.2 0.3 2.6 0.3 3.8 0.1 0.2 2.2 1 4.5 0.1 6.7 -0.7 1.6 -2.8 2.9 -4.3 2.2 -0.6 -0.3 -0.1 -0.1 -0.5 -0.2 1.1 -0.3 2 -1 2.3 -1.5 0.8 -1.4 -0.4 -3.6 -2.2 -3.3 -2.3 0 -3.2 3.1 -1.7 4.6 1.3 1.5 3.8 1.3 5.4 0.3 1.8 -1.2 2 -3.5 1.8 -5.5 -0.1 -0.7 -0.4 -2.6 -0.4 -3.3 0.7 -0.2 0.2 -0.1 1.2 -0.4 2.7 -1 4.4 -4.2 3.6 -7 -0.3 -1.4 -1 -2.9 -2.3 -3.7 z m 0.6 5.7 c 0.2 2 -1.1 4.2 -3.1 4.9 -0.1 -0.8 -0.2 -1 -0.3 -1.4 -0.5 -2.4 -0.7 -4.9 -1.1 -7.3 1.6 -0.2 3.5 0.5 4 2.1 0.2 0.6 0.3 1.2 0.4 1.8 z m -5.1 5.1 c -2.5 0.1 -5 -1.6 -5.6 -4 -0.7 -2.1 -0.5 -4.5 0.8 -6.4 1.1 -1.7 2.6 -3 4 -4.5 0.2 1.1 0.4 2.2 0.5 3.3 -3 0.8 -5 4.6 -3.2 7.3 0.5 0.8 2 2.2 2.8 1.6 -1.1 -0.7 -2 -1.8 -1.8 -3.2 -0.1 -1.3 1.4 -2.9 2.7 -3.1 0.4 2.8 0.9 6 1.4 8.8 -0.5 0.1 -1 0.1 -1.5 0.1 z"/></g></svg>',
            getBoundingBox: function(e, t, n) {
                return {
                    height: 7.5 * e,
                    width: 7.5 * e * .375,
                    x: t,
                    y: n - 4.5 * e
                };
            }
        }
    }, Ee = {
        accidental: "accidental",
        arpeggiate: "arpeggiate",
        bar: "bar",
        beam: "beam",
        clef: "clef",
        decoration: "decoration",
        dots: "dots",
        head: "head",
        ledgerLine: "ledgerLine",
        rest: "rest",
        staff: "staff",
        stem: "stem",
        tieOrSlur: "tieOrSlur",
        timeSignature: "timeSignature"
    };
    function xe() {
        return Object.keys(be).map(function(e) {
            return t = e, n = "data:image/svg+xml," + be[e].svg, (r = document.createElement("img")).dataset.clef = t, 
            r.src = n, r.style.display = "none", r;
            var t, n, r;
        });
    }
    function we(e, t) {
        switch (f.debug("draw " + t.type + " symbol"), t.type) {
          case Ee.clef:
            !function(e, t) {
                e.drawImage(e.canvas.parentElement.querySelector("img[data-clef=" + t.value.symbol + "]"), t.boundingBox.x, t.boundingBox.y, t.boundingBox.width, t.boundingBox.height);
            }(e, t);
            break;

          case Ee.staff:
            !function(e, t) {
                for (var n = 0; n < t.count; n++) ge(e, {
                    x: 0,
                    y: t.top + n * t.gap
                }, {
                    x: e.canvas.width,
                    y: t.top + n * t.gap
                });
            }(e, t);
            break;

          default:
            f.error(t.type + " not implemented");
        }
    }
    function Se(e, t, n, r, i) {
        var o = Math.sqrt(Math.pow(t - r[i - 1], 2) + Math.pow(e - n[i - 1], 2));
        return isNaN(o) ? 0 : o;
    }
    function Te(e, t, n, r, i, o) {
        var a = i[o - 1] + Se(e, t, n, r, o);
        return isNaN(a) ? 0 : a;
    }
    function Re(e) {
        return Object.assign({}, {
            type: "stroke",
            x: [],
            y: [],
            t: [],
            p: [],
            l: [],
            width: 0
        }, e);
    }
    function a(e) {
        return {
            type: e.type,
            x: e.x,
            y: e.y,
            t: e.t
        };
    }
    function Ce(e, t) {
        var n, r, i, o, a, s, c, l = e;
        return n = t.x, r = t.y, i = l.x, o = l.y, a = l.width, s = 2 + a / 4, c = !1, 
        (0 === i.length || 0 === o.length || Math.abs(i[i.length - 1] - n) >= s || Math.abs(o[o.length - 1] - r) >= s) && (c = !0), 
        c ? (l.x.push(t.x), l.y.push(t.y), l.t.push(t.t), l.p.push(function(e, t, n, r, i, o) {
            var a = 1, s = Se(e, t, n, r, o), c = Te(e, t, n, r, i, o);
            0 === c ? a = .5 : s === c ? a = 1 : s < 10 ? a = .2 + Math.pow(.1 * s, .4) : s > c - 10 && (a = .2 + Math.pow(.1 * (c - s), .4));
            var l = a * Math.max(.1, 1 - .1 * Math.sqrt(s));
            return isNaN(parseFloat(l)) ? .5 : l;
        }(t.x, t.y, l.x, l.y, l.l, l.x.length - 1)), l.l.push(Te(t.x, t.y, l.x, l.y, l.l, l.x.length - 1))) : d.trace("ignore filtered point", t), 
        l;
    }
    function ke(e) {
        for (var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : e.x.length, r = Re({
            color: e.color,
            width: e.width
        }), i = t; i < n; i++) Ce(r, {
            x: e.x[i],
            y: e.y[i],
            t: e.t[i]
        });
        return r;
    }
    function h(e, t) {
        var n = void 0;
        return void 0 !== t && t >= 0 && t < e.x.length && (n = {
            x: e.x[t],
            y: e.y[t],
            t: e.t[t],
            p: e.p[t],
            l: e.l[t]
        }), n;
    }
    var Pe = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
        return typeof e;
    } : function(e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
    }, Ie = function(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
    }, _e = function() {
        function r(e, t) {
            for (var n = 0; n < t.length; n++) {
                var r = t[n];
                r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                Object.defineProperty(e, r.key, r);
            }
        }
        return function(e, t, n) {
            return t && r(e.prototype, t), n && r(e, n), e;
        };
    }(), p = function(e) {
        if (Array.isArray(e)) {
            for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
            return n;
        }
        return Array.from(e);
    };
    function Le(e, t) {
        return {
            minX: Math.min(e.minX, t.minX),
            maxX: Math.max(e.maxX, t.maxX),
            minY: Math.min(e.minY, t.minY),
            maxY: Math.max(e.maxY, t.maxY)
        };
    }
    function Ae(e) {
        return {
            minX: Math.min(e.firstPoint.x, e.lastPoint.x),
            maxX: Math.max(e.firstPoint.x, e.lastPoint.x),
            minY: Math.min(e.firstPoint.y, e.lastPoint.y),
            maxY: Math.max(e.firstPoint.y, e.lastPoint.y)
        };
    }
    function Me(e) {
        var t = Math.cos(e.orientation), n = Math.sin(e.orientation), r = t, i = n;
        t *= e.maxRadius, r *= e.minRadius, n *= e.maxRadius, i *= e.minRadius;
        for (var o = Math.abs(e.sweepAngle) / .02, a = [], s = [], c = 0; c <= o; c++) {
            var l = e.startAngle + c / o * e.sweepAngle, u = Math.atan2(Math.sin(l) / e.minRadius, Math.cos(l) / e.maxRadius), d = Math.cos(u), f = Math.sin(u);
            a.push(e.center.x + (t * d - i * f)), s.push(e.center.y + (r * f + n * d));
        }
        return {
            minX: Math.min.apply(Math, a),
            maxX: Math.max.apply(Math, a),
            minY: Math.min.apply(Math, s),
            maxY: Math.max.apply(Math, s)
        };
    }
    function Oe(e) {
        return {
            minX: e.data.topLeftPoint.x,
            maxX: e.data.topLeftPoint.x + e.data.width,
            minY: e.data.topLeftPoint.y,
            maxY: e.data.topLeftPoint.y + e.data.height
        };
    }
    function ze(e) {
        return {
            minX: e.boundingBox.x,
            maxX: e.boundingBox.x + e.boundingBox.width,
            minY: e.boundingBox.y,
            maxY: e.boundingBox.y + e.boundingBox.height
        };
    }
    function De(e) {
        return {
            minX: Math.min.apply(Math, p(e.x)),
            maxX: Math.max.apply(Math, p(e.x)),
            minY: Math.min.apply(Math, p(e.y)),
            maxY: Math.max.apply(Math, p(e.y))
        };
    }
    function Ne(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {
            minX: Number.MAX_VALUE,
            maxX: Number.MIN_VALUE,
            minY: Number.MAX_VALUE,
            maxY: Number.MIN_VALUE
        };
        return t = e.filter(function(e) {
            return "stroke" === e.type;
        }).map(De).reduce(Le, t), t = e.filter(function(e) {
            return "clef" === e.type;
        }).map(ze).reduce(Le, t), t = e.filter(function(e) {
            return "line" === e.type;
        }).map(Ae).reduce(Le, t), t = e.filter(function(e) {
            return "ellipse" === e.type;
        }).map(Me).reduce(Le, t), t = e.filter(function(e) {
            return "textLine" === e.type;
        }).map(Oe).reduce(Le, t);
    }
    function He(e) {
        switch (e.recognitionParams.type) {
          case l.RecognitionType.MUSIC:
            return function(e) {
                var t = Object.assign({}, {
                    type: "staff"
                }, e.recognitionParams.v3.musicParameter.staff), n = {
                    type: "clef",
                    value: Object.assign({}, e.recognitionParams.v3.musicParameter.clef)
                };
                return n.value.yAnchor = t.top + t.gap * (t.count - n.value.line), 
                delete n.value.line, n.boundingBox = be[n.value.symbol].getBoundingBox(t.gap, 0, n.value.yAnchor), 
                [ t, n ];
            }(e);

          default:
            return [];
        }
    }
    function Ue(e) {
        return {
            currentStroke: void 0,
            rawStrokes: [],
            strokeGroups: [],
            lastPositions: {
                lastSentPosition: -1,
                lastReceivedPosition: -1,
                lastRenderedPosition: -1
            },
            defaultSymbols: e ? He(e) : [],
            recognizedSymbols: void 0,
            exports: void 0,
            rawResults: {
                convert: void 0,
                exports: void 0
            },
            creationTime: new Date().getTime(),
            modificationTime: void 0
        };
    }
    function Xe(e) {
        var t = e;
        return t.currentStroke = void 0, t.rawStrokes = [], t.strokeGroups = [], 
        t.lastPositions.lastSentPosition = -1, t.lastPositions.lastReceivedPosition = -1, 
        t.lastPositions.lastRenderedPosition = -1, t.recognizedSymbols = void 0, 
        t.exports = void 0, t.rawResults.convert = void 0, t.rawResults.exports = void 0, 
        t;
    }
    function je(e) {
        return !!e.recognizedSymbols && e.rawStrokes.length !== e.recognizedSymbols.filter(function(e) {
            return "stroke" === e.type;
        }).length;
    }
    function Be(e, t) {
        var n = e;
        return d.debug("addStroke", t), n.rawStrokes.push(t), n;
    }
    function We(e, t, n) {
        var r = e;
        d.debug("addStroke", t);
        var i = r.strokeGroups.length - 1;
        if (r.strokeGroups[i] && r.strokeGroups[i].penStyle === n) r.strokeGroups[i].strokes.push(t); else {
            var o = {
                penStyle: n,
                strokes: []
            }, a = {};
            Object.assign(a, t), o.strokes.push(a), r.strokeGroups.push(o);
        }
        return r;
    }
    function g(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : e.lastPositions.lastReceivedPosition + 1;
        return e.rawStrokes.slice(t);
    }
    function Ye(e, t, n) {
        var r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 96;
        if (n && n["-myscript-pen-width"]) {
            var i = n["-myscript-pen-width"] * r / 25.4;
            Object.assign(n, {
                width: i / 2
            });
        }
        var o = e;
        return d.trace("initPendingStroke", t), o.currentStroke = Re(n), o.currentStroke = Ce(o.currentStroke, t), 
        o;
    }
    function Ge(e, t) {
        var n = e;
        return n.currentStroke && (d.trace("appendToPendingStroke", t), n.currentStroke = Ce(n.currentStroke, t)), 
        n;
    }
    function Fe(e, t, n) {
        var r = e;
        if (r.currentStroke) {
            d.trace("endPendingStroke", t);
            var i = Ce(r.currentStroke, t);
            Be(r, i), We(r, i, n), delete r.currentStroke;
        }
        return r;
    }
    function Ke(e) {
        var t = {
            minX: Number.MAX_VALUE,
            maxX: Number.MIN_VALUE,
            minY: Number.MAX_VALUE,
            maxY: Number.MIN_VALUE
        };
        return e.defaultSymbols && e.defaultSymbols.length > 0 && (t = Ne(e.defaultSymbols, t)), 
        e.recognizedSymbols && e.recognizedSymbols.length > 0 ? (t = Ne(e.recognizedSymbols, t), 
        t = Ne(g(e), t)) : t = Ne(e.rawStrokes, t), t;
    }
    function Ve(e, t, n, r, i) {
        return e.rawStrokes.slice(t, n + 1).map(function(e, t, n) {
            return n.length < 2 ? ke(e, r, i + 1) : 0 === t ? ke(e, r) : t === n.length - 1 ? ke(e, 0, i + 1) : e;
        });
    }
    function s(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : e.rawStrokes.length - 1, n = e;
        return n.lastPositions.lastSentPosition = t, n;
    }
    function m(e) {
        var t = e;
        return t.lastPositions.lastReceivedPosition = t.lastPositions.lastSentPosition, 
        t;
    }
    function o(e) {
        var t = e;
        return t.lastPositions.lastSentPosition = -1, t.lastPositions.lastReceivedPosition = -1, 
        t;
    }
    function Je(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : e.recognizedSymbols ? e.recognizedSymbols.length - 1 : -1, n = e;
        return n.lastPositions.lastRenderedPosition = t, n;
    }
    function qe(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : e.lastPositions.lastRenderedPosition + 1;
        return e.recognizedSymbols ? e.recognizedSymbols.slice(t) : [];
    }
    function Ze(e) {
        var t = Object.assign({}, e);
        return t.defaultSymbols = [].concat(p(e.defaultSymbols)), t.currentStroke = e.currentStroke ? Object.assign({}, e.currentStroke) : void 0, 
        t.rawStrokes = [].concat(p(e.rawStrokes)), t.strokeGroups = JSON.parse(JSON.stringify(e.strokeGroups)), 
        t.lastPositions = Object.assign({}, e.lastPositions), t.exports = e.exports ? Object.assign({}, e.exports) : void 0, 
        t.rawResults = Object.assign({}, e.rawResults), t.recognizedSymbols = e.recognizedSymbols ? [].concat(p(e.recognizedSymbols)) : void 0, 
        t;
    }
    function Qe() {
        for (var e = arguments.length, t = Array(e), n = 0; n < e; n++) t[n] = arguments[n];
        return t.reduce(function(e, t) {
            var n = e;
            return n.recognizedSymbols = t.recognizedSymbols, n.lastPositions.lastSentPosition = t.lastPositions.lastSentPosition, 
            n.lastPositions.lastReceivedPosition = t.lastPositions.lastReceivedPosition, 
            n.lastPositions.lastRenderedPosition = t.lastPositions.lastRenderedPosition, 
            n.rawResults = t.rawResults, n.exports = t.exports, n;
        });
    }
    var $e = Object.freeze({
        createModel: Ue,
        clearModel: Xe,
        needRedraw: je,
        addStroke: Be,
        addStrokeToGroup: We,
        extractPendingStrokes: g,
        initPendingStroke: Ye,
        appendToPendingStroke: Ge,
        endPendingStroke: Fe,
        getBorderCoordinates: Ke,
        extractStrokesFromInkRange: Ve,
        updateModelSentPosition: s,
        updateModelReceivedPosition: m,
        resetModelPositions: o,
        resetModelRendererPosition: function(e) {
            var t = e;
            return t.lastPositions.lastRenderedPosition = -1, t;
        },
        updateModelRenderedPosition: Je,
        extractPendingRecognizedSymbols: qe,
        cloneModel: Ze,
        mergeModels: Qe
    });
    function et(e) {
        return function(e) {
            if (e) {
                var t = e.getContext("2d");
                return (window.devicePixelRatio || 1) / (t.webkitBackingStorePixelRatio || t.mozBackingStorePixelRatio || t.msBackingStorePixelRatio || t.oBackingStorePixelRatio || t.backingStorePixelRatio || 1);
            }
            return 1;
        }(document.createElement("canvas"));
    }
    function tt(e, t) {
        var n = document.createElement("canvas");
        return n.classList.add(t), n.classList.add("ms-canvas"), e.appendChild(n), 
        f.debug("canvas created", n), n;
    }
    function nt(i) {
        return [ i.renderingCanvas, i.capturingCanvas ].forEach(function(e) {
            var t = e.parentNode, n = t.clientWidth < i.minWidth ? i.minWidth : t.clientWidth, r = t.clientHeight < i.minHeight ? i.minHeight : t.clientHeight;
            e.width = n * i.pixelRatio, e.height = r * i.pixelRatio, e.style.width = n + "px", 
            e.style.height = r + "px", e.getContext("2d").scale(i.pixelRatio, i.pixelRatio), 
            f.debug("canvas size changed", e);
        }), i;
    }
    function rt(e, t, n) {
        var r = t.elementType ? t.elementType : t.type;
        f.trace("attempting to draw " + r + " symbol"), "stroke" === r ? ue(e, t, n) : ve[r] ? function(e, t) {
            f.debug("draw " + t.type + " symbol");
            var n = e;
            n.save();
            try {
                if (n.lineWidth = t.width, n.strokeStyle = t.color, t.elementType) switch (t.elementType) {
                  case ve.textLine:
                    ye(n, t);
                    break;

                  default:
                    f.error(t.elementType + " not implemented");
                } else switch (t.type) {
                  case ve.textLine:
                    ye(n, t);
                    break;

                  default:
                    f.error(t.type + " not implemented");
                }
            } finally {
                n.restore();
            }
        }(e, t) : de[r] ? me(e, t) : Ee[r] ? we(e, t) : f.warn("impossible to draw " + r + " symbol");
    }
    function it(t, e, n) {
        t.renderingCanvasContext.clearRect(0, 0, t.renderingCanvas.width, t.renderingCanvas.height);
        var r = [].concat(p(e.defaultSymbols));
        return e.recognizedSymbols ? (r.push.apply(r, p(e.recognizedSymbols)), r.push.apply(r, p(g(e)))) : r.push.apply(r, p(e.rawStrokes)), 
        r.forEach(function(e) {
            return rt(t.renderingCanvasContext, e, n);
        }), t.capturingCanvasContext.clearRect(0, 0, t.capturingCanvas.width, t.capturingCanvas.height), 
        e;
    }
    var ot = Object.freeze({
        getInfo: function() {
            return {
                type: "canvas",
                apiVersion: "V3"
            };
        },
        attach: function(t) {
            var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
            f.debug("attach renderer", t);
            var r = et(), i = xe();
            i.forEach(function(e) {
                return t.appendChild(e);
            });
            var o = tt(t, "ms-rendering-canvas"), a = tt(t, "ms-capture-canvas");
            return nt({
                pixelRatio: r,
                minHeight: e,
                minWidth: n,
                renderingCanvas: o,
                renderingCanvasContext: o.getContext("2d"),
                capturingCanvas: a,
                capturingCanvasContext: a.getContext("2d"),
                resources: i
            });
        },
        detach: function(t, e) {
            f.debug("detach renderer", t), e.resources.forEach(function(e) {
                return t.removeChild(e);
            }), t.removeChild(e.renderingCanvas), t.removeChild(e.capturingCanvas);
        },
        resize: function(e, t, n) {
            return this.drawModel(nt(e), t, n);
        },
        drawCurrentStroke: function(e, t, n) {
            return e.capturingCanvasContext.clearRect(0, 0, e.capturingCanvas.width, e.capturingCanvas.height), 
            f.trace("drawing current stroke ", t.currentStroke), ue(e.capturingCanvasContext, t.currentStroke, n), 
            t;
        },
        drawModel: it
    });
    function v(e, t, n) {
        var r = e.p * n;
        return [ {
            x: e.x - Math.sin(t) * r,
            y: e.y + Math.cos(t) * r
        }, {
            x: e.x + Math.sin(t) * r,
            y: e.y - Math.cos(t) * r
        } ];
    }
    function y(e, t) {
        return {
            x: (t.x + e.x) / 2,
            y: (t.y + e.y) / 2,
            p: (t.p + e.p) / 2
        };
    }
    function b(e, t) {
        return Math.atan2(t.y - e.y, t.x - e.x);
    }
    function at(e, t, n) {
        e.arc(t.x, t.y, n, 0, 2 * Math.PI, !0);
    }
    function st(e, t, n, r) {
        var i = v(t, b(t, n), r), o = v(n, b(t, n), r);
        e.moveTo(i[0].x, i[0].y), e.lineTo(o[0].x, o[0].y), e.lineTo(o[1].x, o[1].y), 
        e.lineTo(i[1].x, i[1].y);
    }
    function ct(e, t, n, r, i) {
        var o = v(t, b(t, r), i), a = v(n, b(r, n), i), s = v(r, b(t, n), i);
        e.moveTo(o[0].x, o[0].y), e.quadraticCurveTo(s[0].x, s[0].y, a[0].x, a[0].y), 
        e.lineTo(a[1].x, a[1].y), e.quadraticCurveTo(s[1].x, s[1].y, o[1].x, o[1].y);
    }
    var lt = Object.freeze({
        getInfo: function() {
            return {
                type: "canvas",
                name: "quadratic",
                apiVersion: "V3"
            };
        },
        drawStroke: function(e, t) {
            var n = e, r = t.x.length, i = t.width > 0 ? t.width : n.lineWidth, o = t.color ? t.color : n.strokeStyle, a = h(t, 0), s = r - 2;
            n.save();
            try {
                if (n.beginPath(), r < 3) at(n, a, .6 * i); else {
                    at(n, a, i * a.p), st(n, a, y(a, h(t, 1)), i);
                    for (var c = 0; c < s; c++) ct(n, y(h(t, c), h(t, c + 1)), y(h(t, c + 1), h(t, c + 2)), h(t, c + 1), i);
                    st(n, y(h(t, r - 2), h(t, r - 1)), h(t, r - 1), i), function(e, t, n, r) {
                        var i = b(t, n), o = v(n, i, r);
                        e.moveTo(o[0].x, o[0].y);
                        for (var a = 1; a <= 6; a++) {
                            var s = i - a * Math.PI / 6;
                            e.lineTo(n.x - n.p * r * Math.sin(s), n.y + n.p * r * Math.cos(s));
                        }
                    }(n, h(t, r - 2), h(t, r - 1), i);
                }
                n.closePath(), void 0 !== o && (n.fillStyle = o, n.fill());
            } finally {
                n.restore();
            }
        }
    }), ut = "http://www.w3.org/1999/xhtml", dt = {
        svg: "http://www.w3.org/2000/svg",
        xhtml: ut,
        xlink: "http://www.w3.org/1999/xlink",
        xml: "http://www.w3.org/XML/1998/namespace",
        xmlns: "http://www.w3.org/2000/xmlns/"
    };
    function ft(e) {
        var t = e += "", n = t.indexOf(":");
        return n >= 0 && "xmlns" !== (t = e.slice(0, n)) && (e = e.slice(n + 1)), 
        dt.hasOwnProperty(t) ? {
            space: dt[t],
            local: e
        } : e;
    }
    function ht(e) {
        var t = ft(e);
        return (t.local ? function(e) {
            return function() {
                return this.ownerDocument.createElementNS(e.space, e.local);
            };
        } : function(n) {
            return function() {
                var e = this.ownerDocument, t = this.namespaceURI;
                return t === ut && e.documentElement.namespaceURI === ut ? e.createElement(n) : e.createElementNS(t, n);
            };
        })(t);
    }
    function pt() {}
    function gt(e) {
        return null == e ? pt : function() {
            return this.querySelector(e);
        };
    }
    function mt() {
        return [];
    }
    var vt = function(e) {
        return function() {
            return this.matches(e);
        };
    };
    if ("undefined" != typeof document) {
        var yt = document.documentElement;
        if (!yt.matches) {
            var bt = yt.webkitMatchesSelector || yt.msMatchesSelector || yt.mozMatchesSelector || yt.oMatchesSelector;
            vt = function(e) {
                return function() {
                    return bt.call(this, e);
                };
            };
        }
    }
    var Et = vt;
    function xt(e) {
        return new Array(e.length);
    }
    function wt(e, t) {
        this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, 
        this._next = null, this._parent = e, this.__data__ = t;
    }
    wt.prototype = {
        constructor: wt,
        appendChild: function(e) {
            return this._parent.insertBefore(e, this._next);
        },
        insertBefore: function(e, t) {
            return this._parent.insertBefore(e, t);
        },
        querySelector: function(e) {
            return this._parent.querySelector(e);
        },
        querySelectorAll: function(e) {
            return this._parent.querySelectorAll(e);
        }
    };
    var St = "$";
    function Tt(e, t, n, r, i, o) {
        for (var a, s = 0, c = t.length, l = o.length; s < l; ++s) (a = t[s]) ? (a.__data__ = o[s], 
        r[s] = a) : n[s] = new wt(e, o[s]);
        for (;s < c; ++s) (a = t[s]) && (i[s] = a);
    }
    function Rt(e, t, n, r, i, o, a) {
        var s, c, l, u = {}, d = t.length, f = o.length, h = new Array(d);
        for (s = 0; s < d; ++s) (c = t[s]) && (h[s] = l = St + a.call(c, c.__data__, s, t), 
        l in u ? i[s] = c : u[l] = c);
        for (s = 0; s < f; ++s) (c = u[l = St + a.call(e, o[s], s, o)]) ? (r[s] = c, 
        c.__data__ = o[s], u[l] = null) : n[s] = new wt(e, o[s]);
        for (s = 0; s < d; ++s) (c = t[s]) && u[h[s]] === c && (i[s] = c);
    }
    function Ct(e, t) {
        return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
    }
    function kt(e) {
        return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
    }
    function Pt(e) {
        return e.trim().split(/^|\s+/);
    }
    function It(e) {
        return e.classList || new _t(e);
    }
    function _t(e) {
        this._node = e, this._names = Pt(e.getAttribute("class") || "");
    }
    function Lt(e, t) {
        for (var n = It(e), r = -1, i = t.length; ++r < i; ) n.add(t[r]);
    }
    function At(e, t) {
        for (var n = It(e), r = -1, i = t.length; ++r < i; ) n.remove(t[r]);
    }
    function Mt() {
        this.textContent = "";
    }
    function Ot() {
        this.innerHTML = "";
    }
    function zt() {
        this.nextSibling && this.parentNode.appendChild(this);
    }
    function Dt() {
        this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }
    function Nt() {
        return null;
    }
    function Ht() {
        var e = this.parentNode;
        e && e.removeChild(this);
    }
    function Ut() {
        return this.parentNode.insertBefore(this.cloneNode(!1), this.nextSibling);
    }
    function Xt() {
        return this.parentNode.insertBefore(this.cloneNode(!0), this.nextSibling);
    }
    _t.prototype = {
        add: function(e) {
            this._names.indexOf(e) < 0 && (this._names.push(e), this._node.setAttribute("class", this._names.join(" ")));
        },
        remove: function(e) {
            var t = this._names.indexOf(e);
            t >= 0 && (this._names.splice(t, 1), this._node.setAttribute("class", this._names.join(" ")));
        },
        contains: function(e) {
            return this._names.indexOf(e) >= 0;
        }
    };
    var jt = {};
    "undefined" != typeof document && ("onmouseenter" in document.documentElement || (jt = {
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }));
    function Bt(n, e, t) {
        return n = Wt(n, e, t), function(e) {
            var t = e.relatedTarget;
            t && (t === this || 8 & t.compareDocumentPosition(this)) || n.call(this, e);
        };
    }
    function Wt(t, n, r) {
        return function(e) {
            try {
                t.call(this, this.__data__, n, r);
            } finally {}
        };
    }
    function Yt(o) {
        return function() {
            var e = this.__on;
            if (e) {
                for (var t, n = 0, r = -1, i = e.length; n < i; ++n) t = e[n], o.type && t.type !== o.type || t.name !== o.name ? e[++r] = t : this.removeEventListener(t.type, t.listener, t.capture);
                ++r ? e.length = r : delete this.__on;
            }
        };
    }
    function Gt(c, l, u) {
        var d = jt.hasOwnProperty(c.type) ? Bt : Wt;
        return function(e, t, n) {
            var r, i = this.__on, o = d(l, t, n);
            if (i) for (var a = 0, s = i.length; a < s; ++a) if ((r = i[a]).type === c.type && r.name === c.name) return this.removeEventListener(r.type, r.listener, r.capture), 
            this.addEventListener(r.type, r.listener = o, r.capture = u), void (r.value = l);
            this.addEventListener(c.type, o, u), r = {
                type: c.type,
                name: c.name,
                value: l,
                listener: o,
                capture: u
            }, i ? i.push(r) : this.__on = [ r ];
        };
    }
    function Ft(e, t, n) {
        var r = kt(e), i = r.CustomEvent;
        "function" == typeof i ? i = new i(t, n) : (i = r.document.createEvent("Event"), 
        n ? (i.initEvent(t, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(t, !1, !1)), 
        e.dispatchEvent(i);
    }
    var Kt = [ null ];
    function w(e, t) {
        this._groups = e, this._parents = t;
    }
    function Vt(e, t, n) {
        n && n.drawStroke(e, t);
    }
    function Jt(e, t, n) {
        var r = e.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "_");
        switch (r.innerHTML = n, t.toLowerCase()) {
          case "beforebegin":
            e.parentNode.insertBefore(r.firstChild, e);
            break;

          case "afterbegin":
            e.insertBefore(r.lastChild, e.firstChild);
            break;

          case "beforeend":
            e.appendChild(r.firstChild);
            break;

          case "afterend":
            e.parentNode.insertBefore(r.lastChild, e.nextSibling);
            break;

          default:
            f.warn("Invalid insertAdjacentHTML position");
        }
    }
    w.prototype = function() {
        return new w([ [ document.documentElement ] ], Kt);
    }.prototype = {
        constructor: w,
        select: function(e) {
            "function" != typeof e && (e = gt(e));
            for (var t = this._groups, n = t.length, r = new Array(n), i = 0; i < n; ++i) for (var o, a, s = t[i], c = s.length, l = r[i] = new Array(c), u = 0; u < c; ++u) (o = s[u]) && (a = e.call(o, o.__data__, u, s)) && ("__data__" in o && (a.__data__ = o.__data__), 
            l[u] = a);
            return new w(r, this._parents);
        },
        selectAll: function(e) {
            var t;
            "function" != typeof e && (e = null == (t = e) ? mt : function() {
                return this.querySelectorAll(t);
            });
            for (var n = this._groups, r = n.length, i = [], o = [], a = 0; a < r; ++a) for (var s, c = n[a], l = c.length, u = 0; u < l; ++u) (s = c[u]) && (i.push(e.call(s, s.__data__, u, c)), 
            o.push(s));
            return new w(i, o);
        },
        filter: function(e) {
            "function" != typeof e && (e = Et(e));
            for (var t = this._groups, n = t.length, r = new Array(n), i = 0; i < n; ++i) for (var o, a = t[i], s = a.length, c = r[i] = [], l = 0; l < s; ++l) (o = a[l]) && e.call(o, o.__data__, l, a) && c.push(o);
            return new w(r, this._parents);
        },
        data: function(e, t) {
            if (!e) return p = new Array(this.size()), u = -1, this.each(function(e) {
                p[++u] = e;
            }), p;
            var n, r = t ? Rt : Tt, i = this._parents, o = this._groups;
            "function" != typeof e && (n = e, e = function() {
                return n;
            });
            for (var a = o.length, s = new Array(a), c = new Array(a), l = new Array(a), u = 0; u < a; ++u) {
                var d = i[u], f = o[u], h = f.length, p = e.call(d, d && d.__data__, u, i), g = p.length, m = c[u] = new Array(g), v = s[u] = new Array(g);
                r(d, f, m, v, l[u] = new Array(h), p, t);
                for (var y, b, E = 0, x = 0; E < g; ++E) if (y = m[E]) {
                    for (E >= x && (x = E + 1); !(b = v[x]) && ++x < g; );
                    y._next = b || null;
                }
            }
            return (s = new w(s, i))._enter = c, s._exit = l, s;
        },
        enter: function() {
            return new w(this._enter || this._groups.map(xt), this._parents);
        },
        exit: function() {
            return new w(this._exit || this._groups.map(xt), this._parents);
        },
        merge: function(e) {
            for (var t = this._groups, n = e._groups, r = t.length, i = n.length, o = Math.min(r, i), a = new Array(r), s = 0; s < o; ++s) for (var c, l = t[s], u = n[s], d = l.length, f = a[s] = new Array(d), h = 0; h < d; ++h) (c = l[h] || u[h]) && (f[h] = c);
            for (;s < r; ++s) a[s] = t[s];
            return new w(a, this._parents);
        },
        order: function() {
            for (var e = this._groups, t = -1, n = e.length; ++t < n; ) for (var r, i = e[t], o = i.length - 1, a = i[o]; --o >= 0; ) (r = i[o]) && (a && a !== r.nextSibling && a.parentNode.insertBefore(r, a), 
            a = r);
            return this;
        },
        sort: function(n) {
            function e(e, t) {
                return e && t ? n(e.__data__, t.__data__) : !e - !t;
            }
            n || (n = Ct);
            for (var t = this._groups, r = t.length, i = new Array(r), o = 0; o < r; ++o) {
                for (var a, s = t[o], c = s.length, l = i[o] = new Array(c), u = 0; u < c; ++u) (a = s[u]) && (l[u] = a);
                l.sort(e);
            }
            return new w(i, this._parents).order();
        },
        call: function() {
            var e = arguments[0];
            return arguments[0] = this, e.apply(null, arguments), this;
        },
        nodes: function() {
            var e = new Array(this.size()), t = -1;
            return this.each(function() {
                e[++t] = this;
            }), e;
        },
        node: function() {
            for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, o = r.length; i < o; ++i) {
                var a = r[i];
                if (a) return a;
            }
            return null;
        },
        size: function() {
            var e = 0;
            return this.each(function() {
                ++e;
            }), e;
        },
        empty: function() {
            return !this.node();
        },
        each: function(e) {
            for (var t = this._groups, n = 0, r = t.length; n < r; ++n) for (var i, o = t[n], a = 0, s = o.length; a < s; ++a) (i = o[a]) && e.call(i, i.__data__, a, o);
            return this;
        },
        attr: function(e, t) {
            var n = ft(e);
            if (arguments.length < 2) {
                var r = this.node();
                return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
            }
            return this.each((null == t ? n.local ? function(e) {
                return function() {
                    this.removeAttributeNS(e.space, e.local);
                };
            } : function(e) {
                return function() {
                    this.removeAttribute(e);
                };
            } : "function" == typeof t ? n.local ? function(t, n) {
                return function() {
                    var e = n.apply(this, arguments);
                    null == e ? this.removeAttributeNS(t.space, t.local) : this.setAttributeNS(t.space, t.local, e);
                };
            } : function(t, n) {
                return function() {
                    var e = n.apply(this, arguments);
                    null == e ? this.removeAttribute(t) : this.setAttribute(t, e);
                };
            } : n.local ? function(e, t) {
                return function() {
                    this.setAttributeNS(e.space, e.local, t);
                };
            } : function(e, t) {
                return function() {
                    this.setAttribute(e, t);
                };
            })(n, t));
        },
        style: function(e, t, n) {
            return arguments.length > 1 ? this.each((null == t ? function(e) {
                return function() {
                    this.style.removeProperty(e);
                };
            } : "function" == typeof t ? function(t, n, r) {
                return function() {
                    var e = n.apply(this, arguments);
                    null == e ? this.style.removeProperty(t) : this.style.setProperty(t, e, r);
                };
            } : function(e, t, n) {
                return function() {
                    this.style.setProperty(e, t, n);
                };
            })(e, t, null == n ? "" : n)) : function(e, t) {
                return e.style.getPropertyValue(t) || kt(e).getComputedStyle(e, null).getPropertyValue(t);
            }(this.node(), e);
        },
        property: function(e, t) {
            return arguments.length > 1 ? this.each((null == t ? function(e) {
                return function() {
                    delete this[e];
                };
            } : "function" == typeof t ? function(t, n) {
                return function() {
                    var e = n.apply(this, arguments);
                    null == e ? delete this[t] : this[t] = e;
                };
            } : function(e, t) {
                return function() {
                    this[e] = t;
                };
            })(e, t)) : this.node()[e];
        },
        classed: function(e, t) {
            var n = Pt(e + "");
            if (arguments.length < 2) {
                for (var r = It(this.node()), i = -1, o = n.length; ++i < o; ) if (!r.contains(n[i])) return !1;
                return !0;
            }
            return this.each(("function" == typeof t ? function(e, t) {
                return function() {
                    (t.apply(this, arguments) ? Lt : At)(this, e);
                };
            } : t ? function(e) {
                return function() {
                    Lt(this, e);
                };
            } : function(e) {
                return function() {
                    At(this, e);
                };
            })(n, t));
        },
        text: function(e) {
            return arguments.length ? this.each(null == e ? Mt : ("function" == typeof e ? function(t) {
                return function() {
                    var e = t.apply(this, arguments);
                    this.textContent = null == e ? "" : e;
                };
            } : function(e) {
                return function() {
                    this.textContent = e;
                };
            })(e)) : this.node().textContent;
        },
        html: function(e) {
            return arguments.length ? this.each(null == e ? Ot : ("function" == typeof e ? function(t) {
                return function() {
                    var e = t.apply(this, arguments);
                    this.innerHTML = null == e ? "" : e;
                };
            } : function(e) {
                return function() {
                    this.innerHTML = e;
                };
            })(e)) : this.node().innerHTML;
        },
        raise: function() {
            return this.each(zt);
        },
        lower: function() {
            return this.each(Dt);
        },
        append: function(e) {
            var t = "function" == typeof e ? e : ht(e);
            return this.select(function() {
                return this.appendChild(t.apply(this, arguments));
            });
        },
        insert: function(e, t) {
            var n = "function" == typeof e ? e : ht(e), r = null == t ? Nt : "function" == typeof t ? t : gt(t);
            return this.select(function() {
                return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
            });
        },
        remove: function() {
            return this.each(Ht);
        },
        clone: function(e) {
            return this.select(e ? Xt : Ut);
        },
        datum: function(e) {
            return arguments.length ? this.property("__data__", e) : this.node().__data__;
        },
        on: function(e, t, n) {
            var r, i, o = function(e) {
                return e.trim().split(/^|\s+/).map(function(e) {
                    var t = "", n = e.indexOf(".");
                    return n >= 0 && (t = e.slice(n + 1), e = e.slice(0, n)), {
                        type: e,
                        name: t
                    };
                });
            }(e + ""), a = o.length;
            if (!(arguments.length < 2)) {
                for (s = t ? Gt : Yt, null == n && (n = !1), r = 0; r < a; ++r) this.each(s(o[r], t, n));
                return this;
            }
            var s = this.node().__on;
            if (s) for (var c, l = 0, u = s.length; l < u; ++l) for (r = 0, c = s[l]; r < a; ++r) if ((i = o[r]).type === c.type && i.name === c.name) return c.value;
        },
        dispatch: function(e, t) {
            return this.each(("function" == typeof t ? function(e, t) {
                return function() {
                    return Ft(this, e, t.apply(this, arguments));
                };
            } : function(e, t) {
                return function() {
                    return Ft(this, e, t);
                };
            })(e, t));
        }
    };
    var qt = Object.freeze({
        getInfo: function() {
            return {
                type: "svg",
                apiVersion: "V4"
            };
        },
        attach: function(e) {
            var t, n = e;
            return f.debug("populate root element", n), n.style.fontSize = "10px", 
            "string" == typeof (t = n) ? new w([ [ document.querySelector(t) ] ], [ document.documentElement ]) : new w([ [ t ] ], Kt);
        },
        detach: function(e, t) {
            f.debug("detach renderer", e), t.select("svg").remove();
        },
        resize: function(e, t, n, r, i) {
            var o = e.node().getBoundingClientRect(), a = e.selectAll("svg"), s = o.width < i ? i : o.width, c = o.height < r ? r : o.height;
            return a.attr("viewBox", "0 0 " + s + ", " + c), a.attr("width", s + "px"), 
            a.attr("height", c + "px"), f.debug("svg viewBox changed", a), t;
        },
        drawCurrentStroke: function(e, t, n) {
            var r = t;
            return r.currentStroke.id = "pendingStroke-" + t.rawStrokes.length, 
            f.trace("drawing current stroke ", t.currentStroke), e.select("#pendingStrokes #" + r.currentStroke.id).remove(), 
            Vt(e.select("#pendingStrokes").append("path").attr("id", t.currentStroke.id), t.currentStroke, n), 
            r;
        },
        drawModel: function(s, e, r) {
            var t = qe(e);
            t && (t.forEach(function(e) {
                var a;
                (a = e).updates.forEach(function(t) {
                    try {
                        var e = 'svg[data-layer="' + a.layer + '"]';
                        switch (t.type) {
                          case "REPLACE_ALL":
                            s.select(e).remove();
                            var n = s.node();
                            n.insertAdjacentHTML ? n.insertAdjacentHTML("beforeEnd", t.svg) : Jt(n, "beforeEnd", t.svg), 
                            "MODEL" === a.layer && s.select(e).append("g").attr("id", "pendingStrokes");
                            break;

                          case "REMOVE_ELEMENT":
                            t.id.includes("s") || t.id.includes("MODEL") ? s.select("#" + t.id).remove() : (s.select("#" + t.id).attr("class", "removed-stroke"), 
                            setTimeout(function() {
                                s.select("#" + t.id).remove();
                            }, 100));
                            break;

                          case "REPLACE_ELEMENT":
                            var r = s.select("#" + t.id).node().parentNode;
                            s.select("#" + t.id).remove(), r.insertAdjacentHTML ? r.insertAdjacentHTML("beforeEnd", t.svg) : (Jt(r, "beforeEnd", t.svg), 
                            s.node().insertAdjacentHTML("beforeEnd", s.select(e).remove().node().outerHTML));
                            break;

                          case "REMOVE_CHILD":
                            s.select("#" + t.parentId + " > *:nth-child(" + (t.index + 1) + ")").remove();
                            break;

                          case "APPEND_CHILD":
                            var i = s.select(t.parentId ? "#" + t.parentId : e).node();
                            i.insertAdjacentHTML ? i.insertAdjacentHTML("beforeEnd", t.svg) : (Jt(i, "beforeEnd", t.svg), 
                            s.node().insertAdjacentHTML("beforeEnd", s.select(e).remove().node().outerHTML));
                            break;

                          case "INSERT_BEFORE":
                            var o = s.select("#" + t.refId).node();
                            o.insertAdjacentHTML ? o.insertAdjacentHTML("beforeBegin", t.svg) : (Jt(o, "beforeBegin", t.svg), 
                            s.node().insertAdjacentHTML("beforeEnd", s.select(e).remove().node().outerHTML));
                            break;

                          case "REMOVE_ATTRIBUTE":
                            s.selectAll(t.id ? "#" + t.id : "svg").attr(t.name, null);
                            break;

                          case "SET_ATTRIBUTE":
                            t.id && s.selectAll("#" + t.id).attr(t.name, t.value);
                            break;

                          default:
                            f.debug("unknown update " + t.type + " action");
                        }
                    } catch (e) {
                        f.error("Invalid update " + t.type, t), f.error("Error on svg patch", e);
                    }
                });
            }), Je(e));
            var n = g(e);
            return n && n.forEach(function(e) {
                return t = e, n = s.select("#pendingStrokes"), f.trace("attempting to draw " + t.type + " symbol"), 
                void ("stroke" !== t.type || n.select("id", t.id) ? f.warn("impossible to draw " + t.type + " symbol") : Vt(n.append("path").attr("id", t.id), t, r));
                var t, n;
            }), e;
        }
    });
    function Zt(e, t, n) {
        return [ "M " + t.x + "," + t.y, "m " + -n + ",0", "a " + n + "," + n + " 0 1 0 " + 2 * n + ",0", "a " + n + "," + n + " 0 1 0 " + -2 * n + ",0" ].join(" ");
    }
    function Qt(e, t, n, r) {
        var i = v(t, b(t, n), r), o = v(n, b(t, n), r);
        return [ "M " + i[0].x + "," + i[0].y, "L " + o[0].x + "," + o[0].y, "L " + o[1].x + "," + o[1].y, "L " + i[1].x + "," + i[1].y ].join(" ");
    }
    function $t(e, t, n, r, i) {
        var o = v(t, b(t, r), i), a = v(n, b(r, n), i), s = v(r, b(t, n), i);
        return [ "M " + o[0].x + "," + o[0].y, "Q " + s[0].x + "," + s[0].y + " " + a[0].x + "," + a[0].y, "L " + a[1].x + "," + a[1].y, "Q " + s[1].x + "," + s[1].y + " " + o[1].x + "," + o[1].y ].join(" ");
    }
    var en = Object.freeze({
        getInfo: function() {
            return {
                type: "svg",
                name: "quadratic",
                apiVersion: "V4"
            };
        },
        drawStroke: function(e, t) {
            var n = t.x.length, r = t.width, i = h(t, 0), o = n - 2, a = [];
            if (n < 3) a.push(Zt(0, i, .6 * r)); else {
                a.push(Zt(0, i, r * i.p)), a.push(Qt(0, i, y(i, h(t, 1)), r));
                for (var s = 0; s < o; s++) a.push($t(0, y(h(t, s), h(t, s + 1)), y(h(t, s + 1), h(t, s + 2)), h(t, s + 1), r));
                a.push(Qt(0, y(h(t, n - 2), h(t, n - 1)), h(t, n - 1), r)), a.push(function(e, t, n, r) {
                    for (var i = b(t, n), o = v(n, i, r), a = [ "M " + o[0].x + "," + o[0].y ], s = 1; s <= 6; s++) {
                        var c = i - s * (Math.PI / 6);
                        a.push("L " + (n.x - n.p * r * Math.sin(c)) + "," + (n.y + n.p * r * Math.cos(c)));
                    }
                    return a.join(" ");
                }(0, h(t, n - 2), h(t, n - 1), r));
            }
            var c = a.join(" ");
            e.attr("color", t.color).style("fill", t.color).style("stroke", "transparent").classed("pending-stroke", !0).attr("d", c + "Z");
        }
    }), tn = t(function(e, t) {
        var n;
        e.exports = (n = n || function(d, e) {
            var n = Object.create || function() {
                function n() {}
                return function(e) {
                    var t;
                    return n.prototype = e, t = new n(), n.prototype = null, t;
                };
            }(), t = {}, r = t.lib = {}, i = r.Base = {
                extend: function(e) {
                    var t = n(this);
                    return e && t.mixIn(e), t.hasOwnProperty("init") && this.init !== t.init || (t.init = function() {
                        t.$super.init.apply(this, arguments);
                    }), t.init.prototype = t, t.$super = this, t;
                },
                create: function() {
                    var e = this.extend();
                    return e.init.apply(e, arguments), e;
                },
                init: function() {},
                mixIn: function(e) {
                    for (var t in e) e.hasOwnProperty(t) && (this[t] = e[t]);
                    e.hasOwnProperty("toString") && (this.toString = e.toString);
                },
                clone: function() {
                    return this.init.prototype.extend(this);
                }
            }, f = r.WordArray = i.extend({
                init: function(e, t) {
                    e = this.words = e || [], this.sigBytes = void 0 != t ? t : 4 * e.length;
                },
                toString: function(e) {
                    return (e || a).stringify(this);
                },
                concat: function(e) {
                    var t = this.words, n = e.words, r = this.sigBytes, i = e.sigBytes;
                    if (this.clamp(), r % 4) for (var o = 0; o < i; o++) {
                        var a = n[o >>> 2] >>> 24 - o % 4 * 8 & 255;
                        t[r + o >>> 2] |= a << 24 - (r + o) % 4 * 8;
                    } else for (var o = 0; o < i; o += 4) t[r + o >>> 2] = n[o >>> 2];
                    return this.sigBytes += i, this;
                },
                clamp: function() {
                    var e = this.words, t = this.sigBytes;
                    e[t >>> 2] &= 4294967295 << 32 - t % 4 * 8, e.length = d.ceil(t / 4);
                },
                clone: function() {
                    var e = i.clone.call(this);
                    return e.words = this.words.slice(0), e;
                },
                random: function(e) {
                    for (var t, n = [], r = function(t) {
                        var t = t, n = 987654321, r = 4294967295;
                        return function() {
                            var e = ((n = 36969 * (65535 & n) + (n >> 16) & r) << 16) + (t = 18e3 * (65535 & t) + (t >> 16) & r) & r;
                            return e /= 4294967296, (e += .5) * (d.random() > .5 ? 1 : -1);
                        };
                    }, i = 0; i < e; i += 4) {
                        var o = r(4294967296 * (t || d.random()));
                        t = 987654071 * o(), n.push(4294967296 * o() | 0);
                    }
                    return new f.init(n, e);
                }
            }), o = t.enc = {}, a = o.Hex = {
                stringify: function(e) {
                    for (var t = e.words, n = e.sigBytes, r = [], i = 0; i < n; i++) {
                        var o = t[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                        r.push((o >>> 4).toString(16)), r.push((15 & o).toString(16));
                    }
                    return r.join("");
                },
                parse: function(e) {
                    for (var t = e.length, n = [], r = 0; r < t; r += 2) n[r >>> 3] |= parseInt(e.substr(r, 2), 16) << 24 - r % 8 * 4;
                    return new f.init(n, t / 2);
                }
            }, s = o.Latin1 = {
                stringify: function(e) {
                    for (var t = e.words, n = e.sigBytes, r = [], i = 0; i < n; i++) {
                        var o = t[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                        r.push(String.fromCharCode(o));
                    }
                    return r.join("");
                },
                parse: function(e) {
                    for (var t = e.length, n = [], r = 0; r < t; r++) n[r >>> 2] |= (255 & e.charCodeAt(r)) << 24 - r % 4 * 8;
                    return new f.init(n, t);
                }
            }, c = o.Utf8 = {
                stringify: function(e) {
                    try {
                        return decodeURIComponent(escape(s.stringify(e)));
                    } catch (e) {
                        throw new Error("Malformed UTF-8 data");
                    }
                },
                parse: function(e) {
                    return s.parse(unescape(encodeURIComponent(e)));
                }
            }, l = r.BufferedBlockAlgorithm = i.extend({
                reset: function() {
                    this._data = new f.init(), this._nDataBytes = 0;
                },
                _append: function(e) {
                    "string" == typeof e && (e = c.parse(e)), this._data.concat(e), 
                    this._nDataBytes += e.sigBytes;
                },
                _process: function(e) {
                    var t = this._data, n = t.words, r = t.sigBytes, i = this.blockSize, o = 4 * i, a = r / o, s = (a = e ? d.ceil(a) : d.max((0 | a) - this._minBufferSize, 0)) * i, c = d.min(4 * s, r);
                    if (s) {
                        for (var l = 0; l < s; l += i) this._doProcessBlock(n, l);
                        var u = n.splice(0, s);
                        t.sigBytes -= c;
                    }
                    return new f.init(u, c);
                },
                clone: function() {
                    var e = i.clone.call(this);
                    return e._data = this._data.clone(), e;
                },
                _minBufferSize: 0
            }), u = (r.Hasher = l.extend({
                cfg: i.extend(),
                init: function(e) {
                    this.cfg = this.cfg.extend(e), this.reset();
                },
                reset: function() {
                    l.reset.call(this), this._doReset();
                },
                update: function(e) {
                    return this._append(e), this._process(), this;
                },
                finalize: function(e) {
                    e && this._append(e);
                    var t = this._doFinalize();
                    return t;
                },
                blockSize: 16,
                _createHelper: function(n) {
                    return function(e, t) {
                        return new n.init(t).finalize(e);
                    };
                },
                _createHmacHelper: function(n) {
                    return function(e, t) {
                        return new u.HMAC.init(n, t).finalize(e);
                    };
                }
            }), t.algo = {});
            return t;
        }(Math), n);
    }), nn = t(function(e, t) {
        e.exports = tn.enc.Hex;
    }), rn = (t(function(e, t) {
        var n, r, i, o, a, s;
        e.exports = (i = (r = n = tn).lib, o = i.Base, a = i.WordArray, (s = r.x64 = {}).Word = o.extend({
            init: function(e, t) {
                this.high = e, this.low = t;
            }
        }), s.WordArray = o.extend({
            init: function(e, t) {
                e = this.words = e || [], this.sigBytes = void 0 != t ? t : 8 * e.length;
            },
            toX32: function() {
                for (var e = this.words, t = e.length, n = [], r = 0; r < t; r++) {
                    var i = e[r];
                    n.push(i.high), n.push(i.low);
                }
                return a.create(n, this.sigBytes);
            },
            clone: function() {
                for (var e = o.clone.call(this), t = e.words = this.words.slice(0), n = t.length, r = 0; r < n; r++) t[r] = t[r].clone();
                return e;
            }
        }), n);
    }), t(function(e, t) {
        var c;
        e.exports = (c = tn, function() {
            var e = c, t = e.lib.Hasher, n = e.x64, r = n.Word, i = n.WordArray, o = e.algo;
            function a() {
                return r.create.apply(r, arguments);
            }
            var Se = [ a(1116352408, 3609767458), a(1899447441, 602891725), a(3049323471, 3964484399), a(3921009573, 2173295548), a(961987163, 4081628472), a(1508970993, 3053834265), a(2453635748, 2937671579), a(2870763221, 3664609560), a(3624381080, 2734883394), a(310598401, 1164996542), a(607225278, 1323610764), a(1426881987, 3590304994), a(1925078388, 4068182383), a(2162078206, 991336113), a(2614888103, 633803317), a(3248222580, 3479774868), a(3835390401, 2666613458), a(4022224774, 944711139), a(264347078, 2341262773), a(604807628, 2007800933), a(770255983, 1495990901), a(1249150122, 1856431235), a(1555081692, 3175218132), a(1996064986, 2198950837), a(2554220882, 3999719339), a(2821834349, 766784016), a(2952996808, 2566594879), a(3210313671, 3203337956), a(3336571891, 1034457026), a(3584528711, 2466948901), a(113926993, 3758326383), a(338241895, 168717936), a(666307205, 1188179964), a(773529912, 1546045734), a(1294757372, 1522805485), a(1396182291, 2643833823), a(1695183700, 2343527390), a(1986661051, 1014477480), a(2177026350, 1206759142), a(2456956037, 344077627), a(2730485921, 1290863460), a(2820302411, 3158454273), a(3259730800, 3505952657), a(3345764771, 106217008), a(3516065817, 3606008344), a(3600352804, 1432725776), a(4094571909, 1467031594), a(275423344, 851169720), a(430227734, 3100823752), a(506948616, 1363258195), a(659060556, 3750685593), a(883997877, 3785050280), a(958139571, 3318307427), a(1322822218, 3812723403), a(1537002063, 2003034995), a(1747873779, 3602036899), a(1955562222, 1575990012), a(2024104815, 1125592928), a(2227730452, 2716904306), a(2361852424, 442776044), a(2428436474, 593698344), a(2756734187, 3733110249), a(3204031479, 2999351573), a(3329325298, 3815920427), a(3391569614, 3928383900), a(3515267271, 566280711), a(3940187606, 3454069534), a(4118630271, 4000239992), a(116418474, 1914138554), a(174292421, 2731055270), a(289380356, 3203993006), a(460393269, 320620315), a(685471733, 587496836), a(852142971, 1086792851), a(1017036298, 365543100), a(1126000580, 2618297676), a(1288033470, 3409855158), a(1501505948, 4234509866), a(1607167915, 987167468), a(1816402316, 1246189591) ], Te = [];
            !function() {
                for (var e = 0; e < 80; e++) Te[e] = a();
            }();
            var s = o.SHA512 = t.extend({
                _doReset: function() {
                    this._hash = new i.init([ new r.init(1779033703, 4089235720), new r.init(3144134277, 2227873595), new r.init(1013904242, 4271175723), new r.init(2773480762, 1595750129), new r.init(1359893119, 2917565137), new r.init(2600822924, 725511199), new r.init(528734635, 4215389547), new r.init(1541459225, 327033209) ]);
                },
                _doProcessBlock: function(D, N) {
                    for (var e = this._hash.words, t = e[0], n = e[1], r = e[2], i = e[3], o = e[4], a = e[5], s = e[6], c = e[7], H = t.high, l = t.low, U = n.high, u = n.low, X = r.high, d = r.low, j = i.high, f = i.low, B = o.high, h = o.low, W = a.high, p = a.low, Y = s.high, G = s.low, F = c.high, K = c.low, g = H, m = l, v = U, y = u, b = X, E = d, V = j, x = f, w = B, S = h, J = W, T = p, q = Y, R = G, Z = F, C = K, k = 0; k < 80; k++) {
                        var Q = Te[k];
                        if (k < 16) var P = Q.high = 0 | D[N + 2 * k], I = Q.low = 0 | D[N + 2 * k + 1]; else {
                            var $ = Te[k - 15], _ = $.high, L = $.low, ee = (_ >>> 1 | L << 31) ^ (_ >>> 8 | L << 24) ^ _ >>> 7, te = (L >>> 1 | _ << 31) ^ (L >>> 8 | _ << 24) ^ (L >>> 7 | _ << 25), ne = Te[k - 2], A = ne.high, M = ne.low, re = (A >>> 19 | M << 13) ^ (A << 3 | M >>> 29) ^ A >>> 6, ie = (M >>> 19 | A << 13) ^ (M << 3 | A >>> 29) ^ (M >>> 6 | A << 26), oe = Te[k - 7], ae = oe.high, se = oe.low, ce = Te[k - 16], le = ce.high, ue = ce.low;
                            P = (P = (P = ee + ae + ((I = te + se) >>> 0 < te >>> 0 ? 1 : 0)) + re + ((I += ie) >>> 0 < ie >>> 0 ? 1 : 0)) + le + ((I += ue) >>> 0 < ue >>> 0 ? 1 : 0), 
                            Q.high = P, Q.low = I;
                        }
                        var O, de = w & J ^ ~w & q, fe = S & T ^ ~S & R, he = g & v ^ g & b ^ v & b, pe = m & y ^ m & E ^ y & E, ge = (g >>> 28 | m << 4) ^ (g << 30 | m >>> 2) ^ (g << 25 | m >>> 7), me = (m >>> 28 | g << 4) ^ (m << 30 | g >>> 2) ^ (m << 25 | g >>> 7), ve = (w >>> 14 | S << 18) ^ (w >>> 18 | S << 14) ^ (w << 23 | S >>> 9), ye = (S >>> 14 | w << 18) ^ (S >>> 18 | w << 14) ^ (S << 23 | w >>> 9), be = Se[k], Ee = be.high, xe = be.low, z = Z + ve + ((O = C + ye) >>> 0 < C >>> 0 ? 1 : 0), we = me + pe;
                        Z = q, C = R, q = J, R = T, J = w, T = S, w = V + (z = (z = (z = z + de + ((O += fe) >>> 0 < fe >>> 0 ? 1 : 0)) + Ee + ((O += xe) >>> 0 < xe >>> 0 ? 1 : 0)) + P + ((O += I) >>> 0 < I >>> 0 ? 1 : 0)) + ((S = x + O | 0) >>> 0 < x >>> 0 ? 1 : 0) | 0, 
                        V = b, x = E, b = v, E = y, v = g, y = m, g = z + (ge + he + (we >>> 0 < me >>> 0 ? 1 : 0)) + ((m = O + we | 0) >>> 0 < O >>> 0 ? 1 : 0) | 0;
                    }
                    l = t.low = l + m, t.high = H + g + (l >>> 0 < m >>> 0 ? 1 : 0), 
                    u = n.low = u + y, n.high = U + v + (u >>> 0 < y >>> 0 ? 1 : 0), 
                    d = r.low = d + E, r.high = X + b + (d >>> 0 < E >>> 0 ? 1 : 0), 
                    f = i.low = f + x, i.high = j + V + (f >>> 0 < x >>> 0 ? 1 : 0), 
                    h = o.low = h + S, o.high = B + w + (h >>> 0 < S >>> 0 ? 1 : 0), 
                    p = a.low = p + T, a.high = W + J + (p >>> 0 < T >>> 0 ? 1 : 0), 
                    G = s.low = G + R, s.high = Y + q + (G >>> 0 < R >>> 0 ? 1 : 0), 
                    K = c.low = K + C, c.high = F + Z + (K >>> 0 < C >>> 0 ? 1 : 0);
                },
                _doFinalize: function() {
                    var e = this._data, t = e.words, n = 8 * this._nDataBytes, r = 8 * e.sigBytes;
                    return t[r >>> 5] |= 128 << 24 - r % 32, t[30 + (r + 128 >>> 10 << 5)] = Math.floor(n / 4294967296), 
                    t[31 + (r + 128 >>> 10 << 5)] = n, e.sigBytes = 4 * t.length, 
                    this._process(), this._hash.toX32();
                },
                clone: function() {
                    var e = t.clone.call(this);
                    return e._hash = this._hash.clone(), e;
                },
                blockSize: 32
            });
            e.SHA512 = t._createHelper(s), e.HmacSHA512 = t._createHmacHelper(s);
        }(), c.SHA512);
    }), t(function(e, t) {
        var n, r, i, o, l, a;
        e.exports = (r = (n = tn).lib, i = r.Base, o = n.enc, l = o.Utf8, a = n.algo, 
        void (a.HMAC = i.extend({
            init: function(e, t) {
                e = this._hasher = new e.init(), "string" == typeof t && (t = l.parse(t));
                var n = e.blockSize, r = 4 * n;
                t.sigBytes > r && (t = e.finalize(t)), t.clamp();
                for (var i = this._oKey = t.clone(), o = this._iKey = t.clone(), a = i.words, s = o.words, c = 0; c < n; c++) a[c] ^= 1549556828, 
                s[c] ^= 909522486;
                i.sigBytes = o.sigBytes = r, this.reset();
            },
            reset: function() {
                var e = this._hasher;
                e.reset(), e.update(this._iKey);
            },
            update: function(e) {
                return this._hasher.update(e), this;
            },
            finalize: function(e) {
                var t = this._hasher, n = t.finalize(e);
                t.reset();
                var r = t.finalize(this._oKey.clone().concat(n));
                return r;
            }
        })));
    }), t(function(e, t) {
        e.exports = tn.HmacSHA512;
    }));
    function E(e, t, n) {
        var r = "object" === (void 0 === e ? "undefined" : Pe(e)) ? JSON.stringify(e) : e;
        return c.debug("The HmacSHA512 function is loaded", rn), new rn(r, t + n).toString(nn);
    }
    function on(t) {
        var n = void 0;
        try {
            n = JSON.parse(t.responseText);
        } catch (e) {
            n = t.responseText;
        }
        return n;
    }

    function canvasToBlob(canvas, callback) {
        canvas.toBlob(function(blob) {
            // 创建对象URL
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = 'canvas-image.png';
            link.href = url;
            link.click();
            
            // 清理对象URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }, 'image/png');
    }

    function an(a, s, c) {
        const canvas = document.querySelector('.ms-rendering-canvas');
        const fullBase64 = canvas.toDataURL('image/png');

        debugger
        return new Promise(function(e, t) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://zenapi.cn/api/file', true);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console('✅ 上传成功！\n响应: ' + xhr.responseText);
                    } else {
                        console('❌ 上传失败！\n状态码: ' + xhr.status + '\n错误: ' + xhr.statusText);
                    }
                }
            };
            
            const requestData = {
                operation: 'saveFile',
                data: fullBase64,
                fileExt: 'png'
            };
            
            xhr.send(JSON.stringify(requestData));
        })
        
        /*canvasToBlob(canvas, function(blob) {
            console.log('图片已转换为Blob格式');
        });*/
        /*
        var e = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {}, l = arguments[4], u = arguments[5], d = e.editor.configuration, f = e;
        return new Promise(function(e, t) {
            var n = new XMLHttpRequest();
            debugger
            if (n.open(a, s, !0), n.withCredentials = !0, "V3" === l) n.setRequestHeader("Accept", "application/json"), 
            n.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8"); else if ("V4" === l) {
                switch (d.recognitionParams.type) {
                  case "TEXT":
                  case "MATH":
                  case "DIAGRAM":
                  case "Raw Content":
                    n.setRequestHeader("Accept", "application/json," + u);
                }
                n.setRequestHeader("applicationKey", d.recognitionParams.server.applicationKey), 
                n.setRequestHeader("hmac", E(JSON.stringify(c), d.recognitionParams.server.applicationKey, d.recognitionParams.server.hmacKey)), 
                n.setRequestHeader("Content-Type", "application/json");
            }
            var r, i, o = u && ("application/vnd.openxmlformats-officedocument.presentationml.presentation" === u || u.startsWith("image/png") || u.startsWith("image/jpeg"));
            o && (n.responseType = "blob"), n.onerror = function() {
                t({
                    msg: "Could not connect to " + s + " connection error",
                    recoverable: !1
                });
            }, n.onload = function() {
                n.status >= 200 && n.status < 300 ? e(o ? n.response : on(n)) : t(new Error(n.responseText));
            }, n.onreadystatechange = function() {
                4 === n.readyState && n.status >= 200 && n.status < 300 && e(o ? n.response : on(n));
            }, f && (f.idle = !1), "V4" === l ? n.send(JSON.stringify(c)) : n.send(c ? (r = c, 
            i = [], Object.keys(r).forEach(function(e) {
                void 0 !== r[e] && "function" != typeof r[e] && i.push(encodeURIComponent(e) + "=" + encodeURIComponent(r[e]));
            }), i.join("&")) : void 0);
        }).then(function(e) {
            return f && (f.idle = !0), e;
        });
        */
    }
    function sn(e, t, n, r, i) {
        return an("POST", t, n, e, r, i);
    }
    function cn(e) {
        var t = Date.now();
        return c.info("Create empty recognizer context with ID: " + t), {
            id: t,
            editor: e,
            recognitionContexts: [],
            initPromise: void 0,
            lastPositions: {
                lastSentPosition: -1,
                lastReceivedPosition: -1
            },
            url: void 0,
            websocket: void 0,
            websocketCallback: void 0,
            reconnect: void 0,
            currentReconnectionCount: 0,
            sessionId: void 0,
            contentPartCount: 0,
            currentPartId: void 0,
            instanceId: void 0,
            canUndo: !1,
            canRedo: !1,
            isEmpty: void 0,
            supportedImportMimeTypes: [],
            undoStackIndex: 0,
            possibleUndoCount: 0,
            idle: !0,
            initialized: !1
        };
    }
    function ln(e, t) {
        return !!e.lastPositions && e.lastPositions.lastSentPosition >= t.rawStrokes.length - 1;
    }
    function x(e, t) {
        var n = e;
        return t && (n.lastPositions.lastSentPosition = t.lastSentPosition, n.lastPositions.lastReceivedPosition = t.lastReceivedPosition), 
        n.lastPositions.lastSentPosition === n.lastPositions.lastReceivedPosition === -1 && delete n.instanceId, 
        n;
    }
    function S(e, t) {
        var n = e;
        return n.recognitionContexts[0] = t, n;
    }
    function un(e) {
        return !0 === e.websocket.autoReconnect && e.currentReconnectionCount <= e.websocket.maxRetryCount;
    }
    function dn(e) {
        var t = e;
        return !0 === t.websocket.autoReconnect && t.currentReconnectionCount++ <= t.websocket.maxRetryCount;
    }
    var fn = {
        type: "LOST_CONNECTION"
    }, hn = "CLOSE_RECOGNIZER", pn = Object.freeze({
        createEmptyRecognizerContext: cn,
        isResetRequired: ln,
        updateRecognitionPositions: x,
        setRecognitionContext: S,
        canReconnect: un,
        shouldAttemptImmediateReconnect: dn,
        LOST_CONNEXION_MESSAGE: fn,
        CLOSE_RECOGNIZER_MESSAGE: hn
    });
    function gn(e, r, t, n) {
        var i = r.editor.configuration;
        return sn(r, i.recognitionParams.server.scheme + "://" + i.recognitionParams.server.host + e, n(r, t), "V3").then(function(e) {
            c.debug("Cdkv3RestRecognizer success", e);
            var t = r.lastPositions;
            t.lastReceivedPosition = t.lastSentPosition;
            var n = x(r, t);
            return e.instanceId && (n.instanceId = e.instanceId), e;
        });
    }
    function mn(e) {
        return e.rawResults && e.rawResults.exports && e.rawResults.exports.result && e.rawResults.exports.result.textSegmentResult && e.rawResults.exports.result.textSegmentResult.candidates ? {
            CANDIDATES: e.rawResults.exports.result,
            TEXT: e.rawResults.exports.result.textSegmentResult.candidates[e.rawResults.exports.result.textSegmentResult.selectedCandidateIdx].label
        } : {};
    }
    function vn(e, t, n) {
        var r = o(t);
        c.debug("Updated model", r);
        var i = x(e, r.lastPositions);
        i.initPromise = Promise.resolve(r), i.initPromise.then(function(e) {
            i.initialized = !0, c.debug("Updated recognizer context", i), n(void 0, e, l.EventType.LOADED);
        });
    }
    function yn(e, t, n) {
        var r = o(t);
        c.debug("Updated model", r);
        var i = x(e, r.lastPositions);
        delete i.instanceId, c.debug("Updated recognizer context", i), n(void 0, r);
    }
    function bn(e, t, n) {
        var r = Xe(t);
        c.debug("Updated model", r);
        var i = x(e, r.lastPositions);
        delete i.instanceId, c.debug("Updated recognizer context", i), n(void 0, r, l.EventType.CHANGED, l.EventType.EXPORTED, l.EventType.RENDERED);
    }
    function En(e, t, n) {
        var r = e;
        r.initialized = !1, delete r.instanceId, n(void 0, t);
    }
    var xn = {
        types: [ l.RecognitionType.TEXT ],
        protocol: l.Protocol.REST,
        apiVersion: "V3",
        availableTriggers: {
            exportContent: [ l.Trigger.QUIET_PERIOD, l.Trigger.DEMAND ]
        }
    };
    function wn(e, t) {
        var n = e.editor.configuration, r = {
            inputUnits: [ {
                textInputType: "MULTI_LINE_TEXT",
                components: t.rawStrokes.map(function(e) {
                    return a(e);
                })
            } ]
        };
        Object.assign(r, {
            textParameter: n.recognitionParams.v3.textParameter
        }), c.debug("input.inputUnits[0].components size is " + r.inputUnits[0].components.length);
        var i = {
            instanceId: e ? e.instanceId : void 0,
            applicationKey: n.recognitionParams.server.applicationKey,
            textInput: JSON.stringify(r)
        };
        return n.recognitionParams.server.hmacKey && (i.hmac = E(i.textInput, n.recognitionParams.server.applicationKey, n.recognitionParams.server.hmacKey)), 
        s(t), i;
    }
    var Sn = Object.freeze({
        textRestV3Configuration: xn,
        getInfo: function() {
            return xn;
        },
        buildInput: wn,
        export_: function(e, t, n) {
            gn("/api/v3.0/recognition/rest/text/doSimpleRecognition.json", e, t, wn).then(function(e) {
                return function(e, t, n) {
                    c.debug("Cdkv3RestTextRecognizer result callback", e);
                    var r = m(e);
                    r.rawResults.exports = t, r.exports = mn(e), c.debug("Cdkv3RestTextRecognizer model updated", r), 
                    n(void 0, r, l.EventType.EXPORTED, l.EventType.IDLE);
                }(t, e, n);
            }).catch(function(e) {
                return n(e, t);
            });
        },
        init: vn,
        close: En,
        clear: bn,
        reset: yn
    });
    function Tn(e) {
        return e.rawResults && e.rawResults.exports && e.rawResults.exports.result && e.rawResults.exports.result.results && e.rawResults.exports.result.results.length > 0 ? e.rawResults.exports.result.results.map(function(e) {
            var t = {};
            return Object.keys(e).includes("root") ? t["" + e.type] = e.root : t["" + e.type] = e.value, 
            t;
        }).reduce(function(e, t) {
            return Object.assign(e, t);
        }, {}) : {};
    }
    function Rn(e) {
        var t = [].concat(p(e.rawStrokes));
        if (e.rawResults && e.rawResults.exports && e.rawResults.exports.result && e.rawResults.exports.result.scratchOutResults && e.rawResults.exports.result.scratchOutResults.length > 0) {
            var n = e.rawResults.exports.result.scratchOutResults.map(function(e) {
                return e.erasedInkRanges.concat(e.inkRanges);
            }).reduce(function(e, t) {
                return e.concat(t);
            });
            return t.filter(function(e, t) {
                return !n.find(function(e) {
                    return e.component === t;
                });
            });
        }
        return t;
    }
    var Cn = {
        types: [ l.RecognitionType.MATH ],
        protocol: l.Protocol.REST,
        apiVersion: "V3",
        availableTriggers: {
            exportContent: [ l.Trigger.QUIET_PERIOD, l.Trigger.DEMAND ]
        }
    };
    function kn(e, t) {
        var n = e.editor.configuration, r = {
            components: t.rawStrokes.map(function(e) {
                return a(e);
            })
        };
        Object.assign(r, n.recognitionParams.v3.mathParameter), c.debug("input.components size is " + r.components.length);
        var i = {
            instanceId: e ? e.instanceId : void 0,
            applicationKey: n.recognitionParams.server.applicationKey,
            mathInput: JSON.stringify(r)
        };
        return n.recognitionParams.server.hmacKey && (i.hmac = E(i.mathInput, n.recognitionParams.server.applicationKey, n.recognitionParams.server.hmacKey)), 
        s(t), i;
    }
    var Pn = Object.freeze({
        mathRestV3Configuration: Cn,
        getInfo: function() {
            return Cn;
        },
        export_: function(e, t, n) {
            return gn("/api/v3.0/recognition/rest/math/doSimpleRecognition.json", e, t, kn).then(function(e) {
                return function(e, t, n) {
                    c.debug("Cdkv3RestMathRecognizer result callback", e);
                    var r = m(e);
                    r.rawResults.exports = t, r.recognizedSymbols = Rn(e), r.exports = Tn(e), 
                    c.debug("Cdkv3RestMathRecognizer model updated", r), n(void 0, r, l.EventType.EXPORTED, l.EventType.IDLE);
                }(t, e, n);
            }).catch(function(e) {
                return n(e, t);
            });
        },
        init: vn,
        close: En,
        clear: bn,
        reset: yn
    });
    function In(t, e) {
        var n = t.rawStrokes;
        return e && e.length > 0 && (n = e.map(function(e) {
            return Ve(t, e.stroke ? e.stroke : e.firstStroke, e.stroke ? e.stroke : e.lastStroke, e.firstPoint, e.lastPoint);
        }).reduce(function(e, t) {
            return e.concat(t);
        })), {
            color: n[0].color,
            width: n[0].width
        };
    }
    function _n(t, e) {
        if (e.candidates && e.candidates.length > 0) {
            var n = e.candidates[e.selectedCandidateIndex];
            switch (n.type) {
              case "notRecognized":
                return e.inkRanges && e.inkRanges.length > 0 ? e.inkRanges.map(function(e) {
                    return Ve(t, e.firstStroke, e.lastStroke, e.firstPoint, e.lastPoint);
                }).reduce(function(e, t) {
                    return e.concat(t);
                }) : [];

              case "recognizedShape":
                return n.primitives;

              default:
                return [];
            }
        }
        return [];
    }
    var Ln = {
        types: [ l.RecognitionType.ANALYZER ],
        protocol: l.Protocol.REST,
        apiVersion: "V3",
        availableTriggers: {
            exportContent: [ l.Trigger.QUIET_PERIOD, l.Trigger.DEMAND ]
        }
    };
    function An(e, t) {
        var n = e.editor.configuration, r = {
            components: t.rawStrokes.map(function(e) {
                return a(e);
            })
        };
        Object.assign(r, {
            parameter: n.recognitionParams.v3.analyzerParameter
        }), c.debug("input.components size is " + r.components.length);
        var i = {
            instanceId: e ? e.instanceId : void 0,
            applicationKey: n.recognitionParams.server.applicationKey,
            analyzerInput: JSON.stringify(r)
        };
        return n.recognitionParams.server.hmacKey && (i.hmac = E(i.analyzerInput, n.recognitionParams.server.applicationKey, n.recognitionParams.server.hmacKey)), 
        s(t), i;
    }
    function Mn(t) {
        return t.rawResults && t.rawResults.exports && t.rawResults.exports.result ? [].concat(p(t.rawResults.exports.result.shapes), p(t.rawResults.exports.result.tables), p(t.rawResults.exports.result.textLines)).map(function(e) {
            return function(e, t) {
                var n = In(e, t.inkRanges);
                switch (t.elementType) {
                  case "table":
                    return t.lines.map(function(e) {
                        return Object.assign(e, n);
                    });

                  case "textLine":
                    return [ t ].map(function(e) {
                        return Object.assign(e, e.result.textSegmentResult.candidates[e.result.textSegmentResult.selectedCandidateIdx], n);
                    });

                  case "shape":
                    return _n(e, t).map(function(e) {
                        return Object.assign(e, n);
                    });

                  default:
                    return [];
                }
            }(t, e);
        }).reduce(function(e, t) {
            return e.concat(t);
        }) : [];
    }
    var On = Object.freeze({
        analyzerRestV3Configuration: Ln,
        getInfo: function() {
            return Ln;
        },
        export_: function(e, t, n) {
            return gn("/api/v3.0/recognition/rest/analyzer/doSimpleRecognition.json", e, t, An).then(function(e) {
                return function(e, t, n) {
                    c.debug("Cdkv3RestAnalyzerRecognizer result callback", e);
                    var r = m(e);
                    r.rawResults.exports = t, r.recognizedSymbols = Mn(e), r.exports = function(e) {
                        return e.rawResults && e.rawResults.exports && e.rawResults.exports.result ? {
                            ANALYSIS: e.rawResults.exports.result
                        } : {};
                    }(e), c.debug("Cdkv3RestAnalyzerRecognizer model updated", r), 
                    n(void 0, r, l.EventType.EXPORTED, l.EventType.CONVERTED, l.EventType.IDLE);
                }(t, e, n);
            }).catch(function(e) {
                return n(e, t);
            });
        },
        init: vn,
        close: En,
        clear: bn,
        reset: yn
    }), zn = {
        types: [ l.RecognitionType.SHAPE ],
        protocol: l.Protocol.REST,
        apiVersion: "V3",
        availableTriggers: {
            exportContent: [ l.Trigger.QUIET_PERIOD, l.Trigger.DEMAND ]
        }
    };
    function Dn(e, t) {
        var n = e.editor.configuration, r = {
            components: g(t).map(function(e) {
                return a(e);
            })
        };
        Object.assign(r, n.recognitionParams.v3.shapeParameter), c.debug("input.components size is " + r.components.length);
        var i = {
            instanceId: e ? e.instanceId : void 0,
            applicationKey: n.recognitionParams.server.applicationKey,
            shapeInput: JSON.stringify(r)
        };
        return n.recognitionParams.server.hmacKey && (i.hmac = E(i.shapeInput, n.recognitionParams.server.applicationKey, n.recognitionParams.server.hmacKey)), 
        s(t), i;
    }
    function Nn(e, t) {
        return {
            instanceSessionId: e ? e.instanceId : void 0
        };
    }
    function Hn(e, t, n) {
        c.debug("Cdkv3RestShapeRecognizer result callback", e);
        var r = m(e);
        r.rawResults.exports = t, r.recognizedSymbols = function(n) {
            return n.rawResults && n.rawResults.exports && n.rawResults.exports.result && n.rawResults.exports.result.segments ? n.rawResults.exports.result.segments.map(function(e) {
                var t = In(n, e.inkRanges);
                return _n(n, e).map(function(e) {
                    return Object.assign(e, t);
                });
            }).reduce(function(e, t) {
                return e.concat(t);
            }) : [];
        }(e), r.exports = function(e) {
            return e.rawResults && e.rawResults.exports && e.rawResults.exports.result && e.rawResults.exports.result.segments ? {
                SEGMENTS: e.rawResults.exports.result.segments
            } : {};
        }(e), c.debug("Cdkv3RestShapeRecognizer model updated", r), n(void 0, r, l.EventType.EXPORTED, l.EventType.CONVERTED, l.EventType.IDLE);
    }
    var Un = Object.freeze({
        shapeRestV3Configuration: zn,
        getInfo: function() {
            return zn;
        },
        export_: function(e, t, n) {
            gn("/api/v3.0/recognition/rest/shape/doSimpleRecognition.json", e, t, Dn).then(function(e) {
                return Hn(t, e, n);
            }).catch(function(e) {
                return n(e, t);
            });
        },
        reset: function(e, t, n) {
            var r = o(t);
            gn("/api/v3.0/recognition/rest/shape/clearSessionId.json", e, r, Nn).then(function(e) {
                return n(void 0, r, l.EventType.IDLE);
            }).catch(function(e) {
                return n(e, r);
            });
        },
        clear: function(e, t, n) {
            var r = Xe(Ze(t));
            gn("/api/v3.0/recognition/rest/shape/clearSessionId.json", e, r, Nn).then(function(e) {
                return n(void 0, r, l.EventType.CHANGED, l.EventType.EXPORTED, l.EventType.CONVERTED, l.EventType.IDLE);
            }).catch(function(e) {
                return n(e, r);
            });
        },
        init: vn,
        close: En
    }), Xn = {
        types: [ l.RecognitionType.MUSIC ],
        protocol: l.Protocol.REST,
        apiVersion: "V3",
        availableTriggers: {
            exportContent: [ l.Trigger.QUIET_PERIOD, l.Trigger.DEMAND ]
        }
    };
    function jn(e, t) {
        var n = e.editor.configuration, r = {
            components: [].concat(t.defaultSymbols, t.rawStrokes).filter(function(e) {
                return "staff" !== e.type;
            }).map(function(e) {
                return "stroke" === e.type ? a(e) : e;
            })
        }, i = Object.assign({}, n.recognitionParams.v3.musicParameter);
        delete i.clef, Object.assign(r, i), c.debug("input.components size is " + r.components.length);
        var o = {
            instanceId: e ? e.instanceId : void 0,
            applicationKey: n.recognitionParams.server.applicationKey,
            musicInput: JSON.stringify(r)
        };
        return n.recognitionParams.server.hmacKey && (o.hmac = E(o.musicInput, n.recognitionParams.server.applicationKey, n.recognitionParams.server.hmacKey)), 
        s(t), o;
    }
    var Bn = Object.freeze({
        musicRestV3Configuration: Xn,
        getInfo: function() {
            return Xn;
        },
        init: function(e, t, n) {
            var r = o(t);
            c.debug("Updated model", r);
            var i = x(e, r.lastPositions);
            i.initPromise = Promise.resolve(r), i.initPromise.then(function(e) {
                i.initialized = !0, c.debug("Updated recognizer context", i), n(void 0, e, l.EventType.LOADED, l.EventType.RENDERED);
            });
        },
        export_: function(e, t, n) {
            gn("/api/v3.0/recognition/rest/music/doSimpleRecognition.json", e, t, jn).then(function(e) {
                return function(e, t, n) {
                    c.debug("Cdkv3RestMusicRecognizer result callback", e);
                    var r = m(e);
                    r.rawResults.exports = t, r.exports = Tn(e), c.debug("Cdkv3RestMusicRecognizer model updated", r), 
                    n(void 0, r, l.EventType.EXPORTED, l.EventType.IDLE);
                }(t, e, n);
            }).catch(function(e) {
                return n(e, t);
            });
        },
        close: En,
        clear: bn,
        reset: yn
    }), Wn = {
        types: [ l.RecognitionType.TEXT, l.RecognitionType.DIAGRAM, l.RecognitionType.MATH, l.RecognitionType.RAWCONTENT ],
        protocol: l.Protocol.REST,
        apiVersion: "V4",
        availableTriggers: {
            exportContent: [ l.Trigger.QUIET_PERIOD, l.Trigger.DEMAND ]
        }
    };
    function Yn(e, r, t, n) {
        var i = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : "", o = arguments[5], a = r.editor.configuration;
        return sn(r, a.recognitionParams.server.scheme + "://" + a.recognitionParams.server.host + e, n(r, t, i), "V4", o).then(function(e) {
            c.debug("iinkRestRecognizer success", e);
            var t = r.lastPositions;
            t.lastReceivedPosition = t.lastSentPosition;
            var n = x(r, t);
            return e.instanceId && (n.instanceId = e.instanceId), e;
        });
    }
    function Gn(e, t, n) {
        var r = e.editor.configuration, i = void 0;
        "TEXT" === r.recognitionParams.type ? i = function(e) {
            return {
                text: e.recognitionParams.v4.text,
                lang: e.recognitionParams.v4.lang,
                export: e.recognitionParams.v4.export
            };
        }(r) : "MATH" === r.recognitionParams.type ? i = function(e) {
            return {
                math: e.recognitionParams.v4.math,
                lang: e.recognitionParams.v4.lang,
                export: e.recognitionParams.v4.export
            };
        }(r) : "DIAGRAM" === r.recognitionParams.type ? i = function(e) {
            return {
                diagram: e.recognitionParams.v4.diagram,
                lang: e.recognitionParams.v4.lang,
                export: e.recognitionParams.v4.export
            };
        }(r) : "Raw Content" === r.recognitionParams.type && (i = function(e) {
            return {
                "raw-content": {
                    recognition: e.recognitionParams.v4["raw-content"].recognition
                },
                lang: e.recognitionParams.v4.lang,
                export: e.recognitionParams.v4.export
            };
        }(r));
        var o = [];
        t.strokeGroups.forEach(function(e) {
            var t = {
                penStyle: "{}" === JSON.stringify(e.penStyle) ? null : ne(e.penStyle),
                strokes: e.strokes.map(function(e) {
                    return function(e) {
                        return {
                            x: e.x,
                            y: e.y,
                            t: e.t
                        };
                    }(e);
                })
            };
            o.push(t);
        });
        var a = {
            configuration: i,
            xDPI: 96,
            yDPI: 96,
            contentType: "Raw Content" === r.recognitionParams.type ? "Raw Content" : r.recognitionParams.type.charAt(0).toUpperCase() + r.recognitionParams.type.slice(1).toLowerCase(),
            theme: oe(e.editor.theme),
            strokeGroups: o
        };
        return e.editor.domElement && (a.height = e.editor.domElement.clientHeight, 
        a.width = e.editor.domElement.clientWidth), n && (a.conversionState = "DIGITAL_EDIT"), 
        s(t), a;
    }
    function Fn(e, t, n) {
        var r = {};
        return r[t] = n, r;
    }
    function Kn(e, t, n, r, i) {
        c.debug("iinkRestRecognizer result callback", e);
        var o = m(e);
        o.rawResults.exports = n, o.exports ? Object.assign(o.exports, Fn(0, r, n)) : o.exports = Fn(0, r, n), 
        c.debug("iinkRestRecognizer model updated", o), i(void 0, o, l.EventType.EXPORTED, l.EventType.IDLE);
    }
    var Vn = Object.freeze({
        iinkRestConfiguration: Wn,
        getInfo: function() {
            return Wn;
        },
        postMessage: Yn,
        export_: function(e, n, r, t) {
            var i = e.editor.configuration;
            function o(t) {
                Yn("/api/v4.0/iink/batch", e, n, Gn, i.restConversionState, t).then(function(e) {
                    Kn(n, 0, e, t, r);
                }).catch(function(e) {
                    r(e, n);
                });
            }
            t ? t.forEach(function(e) {
                o(e);
            }) : "TEXT" === i.recognitionParams.type ? i.recognitionParams.v4.text.mimeTypes.forEach(function(e) {
                o(e);
            }) : "DIAGRAM" === i.recognitionParams.type ? i.recognitionParams.v4.diagram.mimeTypes.forEach(function(e) {
                o(e);
            }) : "MATH" === i.recognitionParams.type ? i.recognitionParams.v4.math.mimeTypes.forEach(function(e) {
                o(e);
            }) : "Raw Content" === i.recognitionParams.type && i.recognitionParams.v4["raw-content"].mimeTypes.forEach(function(e) {
                o(e);
            });
        },
        convert: function(e, t, n) {
            e.editor.configuration, Yn("/api/v4.0/iink/batch", e, t, Gn, "DIGITAL_EDIT").then(function(e) {
                return Kn(t, 0, e, n);
            }).catch(function(e) {
                return n(e, t);
            });
        },
        init: vn,
        close: En,
        clear: bn,
        reset: yn
    });
    function Jn(n) {
        var r = void 0;
        try {
            r = new WebSocket(n.url);
        } catch (n) {
            c.error("Unable to open websocket, Check the host and your connectivity");
        }
        return function(e, t) {
            var n = t.editor.configuration.recognitionParams.server.websocket, r = e;
            r.start = new Date(), r.autoReconnect = n.autoReconnect, r.maxRetryCount = n.maxRetryCount, 
            r.pingEnabled = n.pingEnabled, r.pingDelay = n.pingDelay, r.maxPingLost = n.maxPingLostCount, 
            r.pingLostCount = 0, r.recognizerContext = t;
        }(r, n), r.pingEnabled && function e(t) {
            var n = t;
            n.pingLostCount++, n.pingLostCount > n.maxPingLost ? t.close(1e3, "PING_LOST") : n.readyState <= 1 && setTimeout(function() {
                n.readyState <= 1 && (n.send(JSON.stringify({
                    type: "ping"
                })), e(n));
            }, n.pingDelay);
        }(r), r.onopen = function(e) {
            c.trace("onOpen"), n.websocketCallback(e);
        }, r.onclose = function(e) {
            c.trace("onClose", new Date() - r.start), n.websocketCallback(e);
        }, r.onerror = function(e) {
            c.trace("onError"), n.websocketCallback(e);
        }, r.onmessage = function(e) {
            if (c.trace("onMessage"), r.pingLostCount = 0, "pong" !== JSON.parse(e.data).type) {
                var t = {
                    type: e.type,
                    data: JSON.parse(e.data)
                };
                n.websocketCallback(t);
            }
        }, r;
    }
    function T(e, t) {
        var n = e;
        n.idle = !1;
        var r = n.websocket;
        if (!(r.readyState <= 1)) throw fn;
        r.send(JSON.stringify(t)), c.debug(t.type + " message sent", t);
    }
    function qn(r, i) {
        return function(e) {
            var t = i;
            c.trace(e.type + " websocket callback", e);
            var n = i.recognitionContexts[i.recognitionContexts.length - 1];
            switch (c.debug("Current recognition context", n), e.type) {
              case "open":
                T(i, {
                    type: "applicationKey",
                    applicationKey: i.editor.configuration.recognitionParams.server.applicationKey
                });
                break;

              case "message":
                switch (c.trace("Receiving message", e.data.type), e.data.type) {
                  case "hmacChallenge":
                    T(i, function(e, t) {
                        return {
                            type: "hmac",
                            applicationKey: e.recognitionParams.server.applicationKey,
                            challenge: t.data.challenge,
                            hmac: E(t.data.challenge, e.recognitionParams.server.applicationKey, e.recognitionParams.server.hmacKey)
                        };
                    }(i.editor.configuration, e));
                    break;

                  case "init":
                    t.currentReconnectionCount = 0, t.idle = !0, t.initialized = !0, 
                    n.callback(void 0, e.data), r.resolve(n);
                    break;

                  case "reset":
                    t.idle = !0, n.callback(void 0, e.data);
                    break;

                  case "mathResult":
                  case "textResult":
                    t.idle = !0, e.data.instanceId && (i.instanceId && i.instanceId !== e.data.instanceId && c.debug("Instance id switch from " + i.instanceId + " to " + e.data.instanceId + " this is suspicious"), 
                    t.instanceId = e.data.instanceId, c.debug("Memorizing instance id", e.data.instanceId)), 
                    n.callback(void 0, e.data);
                    break;

                  case "error":
                    c.debug("Error detected stopping all recognition", e), n ? n.callback(e.data) : r.reject(Object.assign({}, e.data, {
                        recoverable: !1
                    }));
                    break;

                  default:
                    c.warn("This is something unexpected in current recognizer. Not the type of message we should have here.", e);
                }
                break;

              case "error":
                c.debug("Error detected stopping all recognition", e), n ? n.callback(Object.assign({}, e, {
                    recoverable: !1
                })) : r.reject(Object.assign({}, e, {
                    recoverable: !1
                }));
                break;

              case "close":
                c.debug("Close detected stopping all recognition", e), t.initialized = !1, 
                n ? n.callback(void 0, e) : r.reject(e);
                break;

              default:
                c.warn("This is something unexpected in current recognizer. Not the type of message we should have here.", e);
            }
        };
    }
    var Zn = function(e, t, n, r) {
        return n && "close" === n.type ? r(t, e, l.EventType.CHANGED) : r(t, e);
    };
    function Qn(e, t, n, r) {
        var i = x(t, t.recognitionContexts[0].model.lastPositions);
        i.url = function(e, t) {
            return ("https" === e.recognitionParams.server.scheme ? "wss" : "ws") + "://" + e.recognitionParams.server.host + t;
        }(t.editor.configuration, e), i.reconnect = r;
        var o, a, s = (o = void 0, a = void 0, {
            promise: new Promise(function(e, t) {
                o = e, a = t;
            }),
            resolve: o,
            reject: a
        });
        return i.initPromise = s.promise, c.debug("Opening the websocket for context ", t), 
        i.websocketCallback = n(s, i), i.websocket = Jn(i), i.initPromise.then(function(e) {
            return c.debug("Init over", e), e;
        });
    }
    function R(n, r, i, o) {
        for (var e = arguments.length, a = Array(e > 4 ? e - 4 : 0), t = 4; t < e; t++) a[t - 4] = arguments[t];
        dn(r) && r.reconnect ? (c.info("Attempting a retry", r.currentReconnectionCount), 
        r.reconnect(r, i, function(e, t) {
            e ? (c.error("Failed retry", e), R.apply(void 0, [ n, r, i, o ].concat(a))) : n.apply(void 0, [ r, t, o ].concat(a));
        })) : o("Unable to reconnect", i);
    }
    function C(n, r) {
        for (var e = arguments.length, i = Array(e > 2 ? e - 2 : 0), t = 2; t < e; t++) i[t - 2] = arguments[t];
        return n.initPromise.then(function() {
            c.trace("Init was done. Sending message");
            var e = r.apply(void 0, i);
            if (e) {
                T(n, e);
                var t = n.recognitionContexts[0].model.lastPositions;
                t && x(n, t);
            } else c.warn("empty message");
        });
    }
    function $n(e, n, r) {
        var t = {
            model: n,
            callback: function(e, t) {
                return Zn(n, e, t, r);
            }
        }, i = e;
        e.initPromise.then(function() {
            return i.recognitionContexts[0] = t, i;
        }).then(function(e) {
            return t = 1e3, n = hn, void ((r = e.websocket) && r.readyState < 2 && r.close(t, n));
            var t, n, r;
        });
    }
    var er = {
        types: [ l.RecognitionType.MATH ],
        protocol: l.Protocol.WEBSOCKET,
        apiVersion: "V3",
        availableTriggers: {
            exportContent: [ l.Trigger.POINTER_UP ]
        }
    };
    function tr(e, t) {
        return s(t), e.lastPositions.lastSentPosition < 0 ? {
            type: "start",
            parameters: e.editor.configuration.recognitionParams.v3.mathParameter,
            components: t.rawStrokes.map(function(e) {
                return a(e);
            })
        } : {
            type: "continue",
            components: g(t, -1).map(function(e) {
                return a(e);
            })
        };
    }
    function nr(e) {
        return o(e), {
            type: "reset"
        };
    }
    var rr = function(e, t, n, r) {
        if (n) {
            if ("init" === n.type) return r(t, e, l.EventType.LOADED, l.EventType.IDLE);
            if ("close" === n.type) return r(t, e, l.EventType.CHANGED);
            var i = m(e);
            return i.rawResults.exports = n, i.exports = Tn(i), i.recognizedSymbols = Rn(i), 
            r(t, i, l.EventType.EXPORTED, l.EventType.IDLE);
        }
        return r(t, e);
    };
    function ir(t, n, r) {
        C(S(t, {
            model: n,
            callback: function(e, t) {
                return rr(n, e, t, r);
            }
        }), nr, n).catch(function(e) {
            return R(ir, t, n, r);
        });
    }
    var or = Object.freeze({
        init: function e(t, n, r) {
            Qn("/api/v3.0/recognition/ws/math", S(t, {
                model: o(n),
                callback: function(e, t) {
                    return rr(n, e, t, r);
                }
            }), qn, e).catch(function(e) {
                dn(t) && t.reconnect ? (c.info("Attempting a reconnect", t.currentReconnectionCount), 
                t.reconnect(t, n, r)) : (c.error("Unable to init", e), r(e, n));
            });
        },
        export_: function t(n, r, i) {
            C(S(n, {
                model: r,
                callback: function(e, t) {
                    return rr(r, e, t, i);
                }
            }), tr, n, r).catch(function(e) {
                return R(t, n, r, i);
            });
        },
        reset: ir,
        mathWebSocketV3Configuration: er,
        getInfo: function() {
            return er;
        },
        clear: function(o, e, a) {
            bn(o, e, function(e, t) {
                for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                ir(o, t, function(e, t) {
                    return c.trace("Session reset");
                }), a.apply(void 0, [ e, t ].concat(r));
            });
        },
        close: $n
    }), ar = {
        types: [ l.RecognitionType.TEXT ],
        protocol: l.Protocol.WEBSOCKET,
        apiVersion: "V3",
        availableTriggers: {
            exportContent: [ l.Trigger.POINTER_UP ]
        }
    };
    function sr(e, t) {
        return s(t), e.lastPositions.lastSentPosition < 0 ? {
            type: "start",
            textParameter: e.editor.configuration.recognitionParams.v3.textParameter,
            inputUnits: [ {
                textInputType: "MULTI_LINE_TEXT",
                components: t.rawStrokes.map(function(e) {
                    return a(e);
                })
            } ]
        } : {
            type: "continue",
            inputUnits: [ {
                textInputType: "MULTI_LINE_TEXT",
                components: g(t, -1).map(function(e) {
                    return a(e);
                })
            } ]
        };
    }
    function cr(e) {
        return o(e), {
            type: "reset"
        };
    }
    var lr = function(e, t, n, r) {
        if (n) {
            if ("init" === n.type) return r(t, e, l.EventType.LOADED, l.EventType.IDLE);
            if ("close" === n.type) return r(t, e, l.EventType.CHANGED);
            var i = m(e);
            return i.rawResults.exports = n, i.exports = mn(e), r(t, i, l.EventType.EXPORTED, l.EventType.IDLE);
        }
        return r(t, e);
    };
    function ur(t, n, r) {
        C(S(t, {
            model: n,
            callback: function(e, t) {
                return lr(n, e, t, r);
            }
        }), cr, n).catch(function(e) {
            return R(ur, t, n, r);
        });
    }
    var dr = Object.freeze({
        init: function e(t, n, r) {
            Qn("/api/v3.0/recognition/ws/text", S(t, {
                model: o(n),
                callback: function(e, t) {
                    return lr(n, e, t, r);
                }
            }), qn, e).catch(function(e) {
                dn(t) && t.reconnect ? (c.info("Attempting a reconnect", t.currentReconnectionCount), 
                t.reconnect(t, n, r)) : (c.error("Unable to init", e), r(e, n));
            });
        },
        export_: function t(n, r, i) {
            C(S(n, {
                model: r,
                callback: function(e, t) {
                    return lr(r, e, t, i);
                }
            }), sr, n, r).catch(function(e) {
                return R(t, n, r, i);
            });
        },
        reset: ur,
        textWebSocketV3Configuration: ar,
        getInfo: function() {
            return ar;
        },
        clear: function(o, e, a) {
            bn(o, e, function(e, t) {
                for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                ur(o, t, function(e, t) {
                    return c.trace("Session reset");
                }), a.apply(void 0, [ e, t ].concat(r));
            });
        },
        close: $n
    });
    function k() {}
    function fr(e, t) {
        return Math.floor(Math.random() * (t - e + 1)) + e;
    }
    k.maxFromBits = function(e) {
        return Math.pow(2, e);
    }, k.limitUI04 = k.maxFromBits(4), k.limitUI06 = k.maxFromBits(6), k.limitUI08 = k.maxFromBits(8), 
    k.limitUI12 = k.maxFromBits(12), k.limitUI14 = k.maxFromBits(14), k.limitUI16 = k.maxFromBits(16), 
    k.limitUI32 = k.maxFromBits(32), k.limitUI40 = k.maxFromBits(40), k.limitUI48 = k.maxFromBits(48), 
    k.randomUI04 = function() {
        return fr(0, k.limitUI04 - 1);
    }, k.randomUI06 = function() {
        return fr(0, k.limitUI06 - 1);
    }, k.randomUI08 = function() {
        return fr(0, k.limitUI08 - 1);
    }, k.randomUI12 = function() {
        return fr(0, k.limitUI12 - 1);
    }, k.randomUI14 = function() {
        return fr(0, k.limitUI14 - 1);
    }, k.randomUI16 = function() {
        return fr(0, k.limitUI16 - 1);
    }, k.randomUI32 = function() {
        return fr(0, k.limitUI32 - 1);
    }, k.randomUI40 = function() {
        return (0 | Math.random() * (1 << 30)) + (0 | 1024 * Math.random()) * (1 << 30);
    }, k.randomUI48 = function() {
        return (0 | Math.random() * (1 << 30)) + (0 | Math.random() * (1 << 18)) * (1 << 30);
    }, k.paddedString = function(e, t, n) {
        e = String(e), n = n || "0";
        for (var r = t - e.length; r > 0; r >>>= 1, n += n) 1 & r && (e = n + e);
        return e;
    }, k.prototype.fromParts = function(e, t, n, r, i, o) {
        return this.version = n >> 12 & 15, this.hex = k.paddedString(e.toString(16), 8) + "-" + k.paddedString(t.toString(16), 4) + "-" + k.paddedString(n.toString(16), 4) + "-" + k.paddedString(r.toString(16), 2) + k.paddedString(i.toString(16), 2) + "-" + k.paddedString(o.toString(16), 12), 
        this;
    }, k.prototype.toString = function() {
        return this.hex;
    }, k.prototype.toURN = function() {
        return "urn:uuid:" + this.hex;
    }, k.prototype.toBytes = function() {
        for (var e = this.hex.split("-"), t = [], n = 0, r = 0; r < e.length; r++) for (var i = 0; i < e[r].length; i += 2) t[n++] = parseInt(e[r].substr(i, 2), 16);
        return t;
    }, k.prototype.equals = function(e) {
        return e instanceof UUID && this.hex === e.hex;
    }, k.getTimeFieldValues = function(e) {
        var t = e - Date.UTC(1582, 9, 15), n = t / 4294967296 * 1e4 & 268435455;
        return {
            low: 1e4 * (268435455 & t) % 4294967296,
            mid: 65535 & n,
            hi: n >>> 16,
            timestamp: t
        };
    }, k._create4 = function() {
        return new k().fromParts(k.randomUI32(), k.randomUI16(), 16384 | k.randomUI12(), 128 | k.randomUI06(), k.randomUI08(), k.randomUI48());
    }, k._create1 = function() {
        var e = new Date().getTime(), t = k.randomUI14(), n = 1099511627776 * (1 | k.randomUI08()) + k.randomUI40(), r = k.randomUI04(), i = 0;
        e != i ? (e < i && t++, i = e, r = k.randomUI04()) : Math.random() < .25 && r < 9984 ? r += 1 + k.randomUI04() : t++;
        var o = k.getTimeFieldValues(i), a = o.low + r, s = 4095 & o.hi | 4096, c = (t &= 16383) >>> 8 | 128, l = 255 & t;
        return new k().fromParts(a, o.mid, s, c, l, n);
    }, k.create = function(e) {
        return this["_create" + (e = e || 4)]();
    }, k.fromTime = function(e, t) {
        t = t || !1;
        var n = k.getTimeFieldValues(e), r = n.low, i = 4095 & n.hi | 4096;
        return !1 === t ? new k().fromParts(r, n.mid, i, 0, 0, 0) : new k().fromParts(r, n.mid, i, 128 | k.limitUI06, k.limitUI08 - 1, k.limitUI48 - 1);
    }, k.firstFromTime = function(e) {
        return k.fromTime(e, !1);
    }, k.lastFromTime = function(e) {
        return k.fromTime(e, !0);
    }, k.fromURN = function(e) {
        var t;
        return (t = /^(?:urn:uuid:|\{)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{2})([0-9a-f]{2})-([0-9a-f]{12})(?:\})?$/i.exec(e)) ? new k().fromParts(parseInt(t[1], 16), parseInt(t[2], 16), parseInt(t[3], 16), parseInt(t[4], 16), parseInt(t[5], 16), parseInt(t[6], 16)) : null;
    }, k.fromBytes = function(e) {
        if (e.length < 5) return null;
        for (var t = "", n = 0, r = [ 4, 2, 2, 2, 6 ], i = 0; i < r.length; i++) {
            for (var o = 0; o < r[i]; o++) {
                var a = e[n++].toString(16);
                1 == a.length && (a = "0" + a), t += a;
            }
            6 !== r[i] && (t += "-");
        }
        return k.fromURN(t);
    }, k.fromBinary = function(e) {
        for (var t = [], n = 0; n < e.length; n++) if (t[n] = e.charCodeAt(n), t[n] > 255 || t[n] < 0) throw new Error("Unexpected byte in binary data.");
        return k.fromBytes(t);
    }, k.new = function() {
        return this.create(4);
    }, k.newTS = function() {
        return this.create(1);
    };
    var hr = k;
    function pr(r, i) {
        return function(e) {
            var t = i;
            c.trace(e.type + " websocket callback", e);
            var n = i.recognitionContexts[i.recognitionContexts.length - 1];
            switch (c.debug("Current recognition context", n), e.type) {
              case "open":
                i.sessionId ? T(i, vr(i.editor.configuration, i.editor.domElement, i.sessionId)) : T(i, mr(i.editor.configuration, i.editor.domElement));
                break;

              case "message":
                switch (c.debug("Receiving " + e.data.type + " message", e), e.data.type) {
                  case "ack":
                    e.data.hmacChallenge && T(i, function(e, t) {
                        return {
                            type: "hmac",
                            hmac: E(t.data.hmacChallenge, e.recognitionParams.server.applicationKey, e.recognitionParams.server.hmacKey)
                        };
                    }(i.editor.configuration, e)), e.data.iinkSessionId && (t.sessionId = e.data.iinkSessionId);
                    break;

                  case "newPart":
                    break;

                  case "contentPackageDescription":
                    t.currentReconnectionCount = 0, t.contentPartCount = e.data.contentPartCount, 
                    T(i, Er(i.editor.configuration)), t.currentPartId ? T(i, br(i.editor.configuration, i.currentPartId)) : T(i, yr(i.editor.configuration));
                    break;

                  case "partChanged":
                    e.data.partId && (t.currentPartId = e.data.partId), t.initialized = !0, 
                    T(i, Dr(i.editor.theme)), T(i, Or(i.editor.penStyle)), T(i, zr(i.editor.penStyleClasses)), 
                    n.callback(void 0, e.data), r.resolve(n);
                    break;

                  case "contentChanged":
                    void 0 !== e.data.canUndo && (t.canUndo = e.data.canUndo), void 0 !== e.data.canRedo && (t.canRedo = e.data.canRedo), 
                    void 0 !== e.data.empty && (t.isEmpty = e.data.empty), void 0 !== e.data.possibleUndoCount && (t.possibleUndoCount = e.data.possibleUndoCount), 
                    void 0 !== e.data.undoStackIndex && (t.undoStackIndex = e.data.undoStackIndex), 
                    n.callback(void 0, e.data);
                    break;

                  case "exported":
                  case "svgPatch":
                    n.callback(void 0, e.data);
                    break;

                  case "supportedImportMimeTypes":
                    t.supportedImportMimeTypes = e.data.mimeTypes, n.callback(void 0, e.data);
                    break;

                  case "fileChunkAck":
                    n.callback(void 0, e.data);
                    break;

                  case "idle":
                    t.idle = !0, n.callback(void 0, e.data);
                    break;

                  case "error":
                    c.debug("Error detected stopping all recognition", e), n ? n.callback(e.data) : r.reject(Object.assign({}, e.data, {
                        recoverable: !1
                    }));
                    break;

                  default:
                    c.warn("This is something unexpected in current recognizer. Not the type of message we should have here.", e);
                }
                break;

              case "error":
                c.debug("Error detected stopping all recognition", e), n ? n.callback(Object.assign({}, e, {
                    recoverable: !1
                })) : r.reject(Object.assign({}, e, {
                    recoverable: !1
                }));
                break;

              case "close":
                c.debug("Close detected stopping all recognition", e), t.initialized = !1, 
                t.canRedo = !1, t.canUndo = !1, n ? n.callback(e) : r.reject(e);
                break;

              default:
                c.warn("This is something unexpected in current recognizer. Not the type of message we should have here.", e);
            }
        };
    }
    var gr = {
        types: [ l.RecognitionType.MATH, l.RecognitionType.TEXT, l.RecognitionType.DIAGRAM, l.RecognitionType.NEBO ],
        protocol: l.Protocol.WEBSOCKET,
        apiVersion: "V4",
        availableTriggers: {
            exportContent: [ l.Trigger.POINTER_UP, l.Trigger.DEMAND ],
            addStrokes: [ l.Trigger.POINTER_UP ]
        }
    };
    function mr(e, t) {
        return {
            type: "newContentPackage",
            applicationKey: e.recognitionParams.server.applicationKey,
            xDpi: 96,
            yDpi: 96,
            viewSizeHeight: t.clientHeight < e.renderingParams.minHeight ? e.renderingParams.minHeight : t.clientHeight,
            viewSizeWidth: t.clientWidth < e.renderingParams.minWidth ? e.renderingParams.minWidth : t.clientWidth
        };
    }
    function vr(e, t, n) {
        return {
            type: "restoreIInkSession",
            iinkSessionId: n,
            applicationKey: e.recognitionParams.server.applicationKey,
            xDpi: 96,
            yDpi: 96,
            viewSizeHeight: t.clientHeight < e.renderingParams.minHeight ? e.renderingParams.minHeight : t.clientHeight,
            viewSizeWidth: t.clientWidth < e.renderingParams.minWidth ? e.renderingParams.minWidth : t.clientWidth
        };
    }
    function yr(e) {
        return {
            type: "newContentPart",
            contentType: e.recognitionParams.type,
            mimeTypes: e.triggers.exportContent !== l.Trigger.DEMAND ? e.recognitionParams.v4["" + e.recognitionParams.type.toLowerCase()].mimeTypes : void 0
        };
    }
    function br(e, t) {
        return {
            type: "openContentPart",
            id: t,
            mimeTypes: e.triggers.exportContent !== l.Trigger.DEMAND ? e.recognitionParams.v4["" + e.recognitionParams.type.toLowerCase()].mimeTypes : void 0
        };
    }
    function Er(e) {
        return Object.assign({
            type: "configuration"
        }, e.recognitionParams.v4);
    }
    function xr(e, t) {
        var n = g(t, e.lastPositions.lastSentPosition + 1);
        if (n.length > 0) return s(t), {
            type: "addStrokes",
            strokes: n.map(function(e) {
                return Object.assign({}, {
                    id: e.id,
                    pointerType: e.pointerType,
                    pointerId: e.pointerId,
                    x: e.x,
                    y: e.y,
                    t: e.t,
                    p: e.p
                });
            })
        };
    }
    function wr() {
        return {
            type: "undo"
        };
    }
    function Sr() {
        return {
            type: "redo"
        };
    }
    function Tr() {
        return {
            type: "clear"
        };
    }
    function Rr(e) {
        return {
            type: "convert",
            conversionState: e
        };
    }
    function Cr(e) {
        return {
            type: "zoom",
            zoom: e
        };
    }
    function kr(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0, n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
        return {
            type: "changeViewSize",
            height: e.clientHeight < t ? t : e.clientHeight,
            width: e.clientWidth < n ? n : e.clientWidth
        };
    }
    function Pr(e, t, n) {
        return {
            type: "export",
            partId: t,
            mimeTypes: n && 0 !== Object.keys(n).length ? n : e.recognitionParams.v4["" + e.recognitionParams.type.toLowerCase()].mimeTypes
        };
    }
    function Ir(e, t) {
        return {
            type: "importFile",
            importFileId: e,
            mimeType: t
        };
    }
    function _r(e, t, n) {
        return {
            type: "fileChunk",
            importFileId: e,
            data: t,
            lastChunk: n
        };
    }
    function Lr(e) {
        return Object.assign({
            type: "pointerEvents"
        }, e);
    }
    function Ar() {
        return {
            type: "waitForIdle"
        };
    }
    function Mr() {
        return {
            type: "getSupportedImportMimeTypes"
        };
    }
    function Or(e) {
        return {
            type: "setPenStyle",
            style: e ? ne(e) : ""
        };
    }
    function zr(e) {
        return {
            type: "setPenStyleClasses",
            styleClasses: e
        };
    }
    function Dr(e) {
        return {
            type: "setTheme",
            theme: oe(e)
        };
    }
    var P = function(e, t, n, r) {
        var i = m(e);
        if (n) {
            if (void 0 !== n.updates) return i.recognizedSymbols ? i.recognizedSymbols.push(n) : i.recognizedSymbols = [ n ], 
            r(t, i, l.EventType.RENDERED);
            if (void 0 !== n.exports) return i.rawResults.exports = n, i.exports = n.exports, 
            r(t, i, l.EventType.EXPORTED);
            if (void 0 !== n.canUndo || void 0 !== n.canRedo) return r(t, i, l.EventType.CHANGED);
            if ("supportedImportMimeTypes" === n.type) return r(t, i, l.EventType.SUPPORTED_IMPORT_MIMETYPES);
            if ("partChanged" === n.type) return r(t, i, l.EventType.LOADED);
            if ("idle" === n.type) return r(t, i, l.EventType.IDLE);
            if ("close" === n.type) return r(t, i, l.EventType.CHANGED);
        }
        return r(t, i);
    };
    var I = {
        grabber: le,
        strokerList: [ lt, en ],
        rendererList: [ ot, qt ],
        recognizerList: [ Sn, Pn, On, Un, Bn, Vn, dr, or, Object.freeze({
            init: function e(t, n, r) {
                Qn("/api/v4.0/iink/document", S(t, {
                    model: s(n, n.lastPositions.lastReceivedPosition),
                    callback: function(e, t) {
                        return P(n, e, t, r);
                    }
                }), pr, e).catch(function(e) {
                    dn(t) && t.reconnect ? (c.info("Attempting a reconnect", t.currentReconnectionCount), 
                    t.reconnect(t, n, r)) : (c.error("Unable to reconnect", e), 
                    P(n, e, void 0, r));
                });
            },
            newContentPart: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), yr, n.editor.configuration).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            openContentPart: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), br, n.editor.configuration, n.currentPartId).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            sendConfiguration: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Er, n.editor.configuration).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            pointerEvents: function t(n, r, i, o) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, o);
                    }
                }), Lr, i).catch(function(e) {
                    return R(t, n, r, i, o);
                });
            },
            addStrokes: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), xr, n, r).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            undo: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), wr).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            redo: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Sr).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            clear: function t(i, o, a) {
                C(S(i, {
                    model: o,
                    callback: function(n, r) {
                        bn(i, o, function(e, t) {
                            c.debug("The model after clear is :", t), P(t, n, r, a);
                        });
                    }
                }), Tr).catch(function(e) {
                    return R(t, i, o, a);
                });
            },
            convert: function t(n, r, i, o) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Rr, o).catch(function(e) {
                    return R(t, n, r, i, o);
                });
            },
            export_: function t(n, r, i, o) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Pr, n.editor.configuration, n.currentPartId, o).catch(function(e) {
                    return R(t, n, r, i, o);
                });
            },
            import_: function n(r, i, o, a) {
                for (var s = {
                    model: i,
                    callback: function(e, t) {
                        return P(i, e, t, a);
                    },
                    importFileId: hr.create(4).toString()
                }, c = S(r, s), l = r.editor.configuration.recognitionParams.server.websocket.fileChunkSize, e = function(t) {
                    0 === t && C(c, Ir, s.importFileId, o.type).catch(function(e) {
                        return R(n, r, i, o, a);
                    }), function(n) {
                        var r = this, i = new FileReader();
                        return new Promise(function(t, e) {
                            i.onload = function(e) {
                                return t(e.target.result);
                            }, i.onerror = function() {
                                return e(r);
                            }, i.readAsText(n);
                        });
                    }(o.slice(t, l, o.type)).then(function(e) {
                        C(c, _r, s.importFileId, e, t + l > o.size).catch(function(e) {
                            return R(n, r, i, o, a);
                        });
                    });
                }, t = 0; t < o.size; t += l) e(t);
            },
            getSupportedImportMimeTypes: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Mr).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            waitForIdle: function t(n, r, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Ar).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            resize: function t(n, r, i, o) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), kr, o, n.editor.configuration.renderingParams.minHeight, n.editor.configuration.renderingParams.minWidth).catch(function(e) {
                    return R(t, n, r, i, o);
                });
            },
            zoom: function t(n, r) {
                var e = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 10, i = arguments[3];
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Cr, e).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            setPenStyle: function t(n, r, e, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Or, e).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            setPenStyleClasses: function t(n, r, e, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), zr, e).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            setTheme: function t(n, r, e, i) {
                C(S(n, {
                    model: r,
                    callback: function(e, t) {
                        return P(r, e, t, i);
                    }
                }), Dr, e).catch(function(e) {
                    return R(t, n, r, i);
                });
            },
            IInkWebSocketV4Configuration: gr,
            getInfo: function() {
                return gr;
            },
            buildNewContentPackageInput: mr,
            buildRestoreIInkSessionInput: vr,
            buildNewContentPart: yr,
            buildOpenContentPart: br,
            buildConfiguration: Er,
            buildSetPenStyle: Or,
            buildSetPenStyleClasses: zr,
            buildSetTheme: Dr,
            close: $n
        }) ],
        callbacks: [ function(e, t) {
            U.info("emitting " + e + " event", t), this.dispatchEvent(new CustomEvent(e, Object.assign({
                bubbles: !0,
                composed: !0
            }, t ? {
                detail: t
            } : void 0)));
        } ],
        getBehaviorFromConfiguration: function(e, t) {
            var n = {};
            return n.grabber = e.grabber, t && ("V4" === t.recognitionParams.apiVersion && "REST" === t.recognitionParams.protocol ? n.stroker = lt : n.stroker = e.strokerList.find(function(e) {
                return e.getInfo().apiVersion === t.recognitionParams.apiVersion && e.getInfo().name === t.renderingParams.stroker;
            }), "V4" === t.recognitionParams.apiVersion && "REST" === t.recognitionParams.protocol ? n.renderer = ot : n.renderer = e.rendererList.find(function(e) {
                return e.getInfo().apiVersion === t.recognitionParams.apiVersion;
            }), n.recognizer = e.recognizerList.find(function(e) {
                return e.getInfo().types.includes(t.recognitionParams.type) && e.getInfo().protocol === t.recognitionParams.protocol && e.getInfo().apiVersion === t.recognitionParams.apiVersion;
            })), n.callbacks = e.callbacks, n;
        }
    };
    function Nr(e) {
        var t = e;
        return t.canUndo = e.currentPosition > 0, t.canRedo = e.currentPosition < e.stack.length - 1, 
        t;
    }
    function Hr(e, t) {
        for (var n = !(arguments.length > 2 && void 0 !== arguments[2]) || arguments[2], r = e.stack[e.currentPosition], i = arguments.length, o = Array(i > 3 ? i - 3 : 0), a = 3; a < i; a++) o[a - 3] = arguments[a];
        t.apply(void 0, [ void 0, n ? Ze(r) : r ].concat(o));
    }
    var Ur = Object.freeze({
        getModel: Hr,
        updateModel: function(e, t, n) {
            var r = e.stack.findIndex(function(e) {
                return e.modificationTime === t.modificationTime && e.rawStrokes.length === t.rawStrokes.length;
            }), i = t;
            i.modificationTime = new Date().getTime();
            var o = [];
            if (r > -1) e.stack.splice(r, 1, Ze(i)), d.debug("model updated", i); else {
                var a = e;
                a.currentPosition += 1, a.stack = a.stack.slice(0, a.currentPosition), 
                a.stack.push(Ze(i)), a.stack.length > a.maxSize && (a.stack.shift(), 
                a.currentPosition--), d.debug("model pushed", i), o.push(l.EventType.CHANGED);
            }
            Nr(e), d.debug("undo/redo stack updated", e), Hr.apply(void 0, [ e, n, !1 ].concat(o));
        },
        undo: function(e, t, n) {
            var r = e;
            r.currentPosition > 0 && (r.currentPosition -= 1, Nr(e), d.debug("undo index", r.currentPosition)), 
            Hr(e, n, !0, l.EventType.CHANGED, l.EventType.EXPORTED);
        },
        redo: function(e, t, n) {
            var r = e;
            r.currentPosition < r.stack.length - 1 && (r.currentPosition += 1, Nr(e), 
            d.debug("redo index", r.currentPosition)), Hr(e, n, !0, l.EventType.CHANGED, l.EventType.EXPORTED);
        }
    });
    function Xr(e) {
        var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 10, n = document.createElement("canvas");
        return n.width = Math.abs(e.maxX - e.minX) + 2 * t, n.style.width = n.width + "px", 
        n.height = Math.abs(e.maxY - e.minY) + 2 * t, n.style.height = n.height + "px", 
        n;
    }
    function _(e) {
        return getComputedStyle(e);
    }
    function L(e, t) {
        for (var n in t) {
            var r = t[n];
            "number" == typeof r && (r += "px"), e.style[n] = r;
        }
        return e;
    }
    function jr(e) {
        var t = document.createElement("div");
        return t.className = e, t;
    }
    var Br = "undefined" != typeof Element && (Element.prototype.matches || Element.prototype.webkitMatchesSelector || Element.prototype.msMatchesSelector);
    function Wr(e, t) {
        if (!Br) throw new Error("No element matching method supported");
        return Br.call(e, t);
    }
    function Yr(e) {
        e.remove ? e.remove() : e.parentNode && e.parentNode.removeChild(e);
    }
    function Gr(e, t) {
        return Array.prototype.filter.call(e.children, function(e) {
            return Wr(e, t);
        });
    }
    var A = {
        main: "ps",
        element: {
            thumb: function(e) {
                return "ps__thumb-" + e;
            },
            rail: function(e) {
                return "ps__rail-" + e;
            },
            consuming: "ps__child--consume"
        },
        state: {
            focus: "ps--focus",
            active: function(e) {
                return "ps--active-" + e;
            },
            scrolling: function(e) {
                return "ps--scrolling-" + e;
            }
        }
    }, Fr = {
        x: null,
        y: null
    };
    function Kr(e, t) {
        var n = e.element.classList, r = A.state.scrolling(t);
        n.contains(r) ? clearTimeout(Fr[t]) : n.add(r);
    }
    function Vr(e, t) {
        Fr[t] = setTimeout(function() {
            return e.isAlive && e.element.classList.remove(A.state.scrolling(t));
        }, e.settings.scrollingThreshold);
    }
    var Jr = function(e) {
        this.element = e, this.handlers = {};
    }, qr = {
        isEmpty: {
            configurable: !0
        }
    };
    Jr.prototype.bind = function(e, t) {
        void 0 === this.handlers[e] && (this.handlers[e] = []), this.handlers[e].push(t), 
        this.element.addEventListener(e, t, !1);
    }, Jr.prototype.unbind = function(t, n) {
        var r = this;
        this.handlers[t] = this.handlers[t].filter(function(e) {
            return !(!n || e === n) || (r.element.removeEventListener(t, e, !1), 
            !1);
        });
    }, Jr.prototype.unbindAll = function() {
        for (var e in this.handlers) this.unbind(e);
    }, qr.isEmpty.get = function() {
        var t = this;
        return Object.keys(this.handlers).every(function(e) {
            return 0 === t.handlers[e].length;
        });
    }, Object.defineProperties(Jr.prototype, qr);
    var Zr = function() {
        this.eventElements = [];
    };
    function Qr(e) {
        if ("function" == typeof window.CustomEvent) return new CustomEvent(e);
        var t = document.createEvent("CustomEvent");
        return t.initCustomEvent(e, !1, !1, void 0), t;
    }
    Zr.prototype.eventElement = function(t) {
        var e = this.eventElements.filter(function(e) {
            return e.element === t;
        })[0];
        return e || (e = new Jr(t), this.eventElements.push(e)), e;
    }, Zr.prototype.bind = function(e, t, n) {
        this.eventElement(e).bind(t, n);
    }, Zr.prototype.unbind = function(e, t, n) {
        var r = this.eventElement(e);
        r.unbind(t, n), r.isEmpty && this.eventElements.splice(this.eventElements.indexOf(r), 1);
    }, Zr.prototype.unbindAll = function() {
        this.eventElements.forEach(function(e) {
            return e.unbindAll();
        }), this.eventElements = [];
    }, Zr.prototype.once = function(e, t, n) {
        var r = this.eventElement(e), i = function(e) {
            r.unbind(t, i), n(e);
        };
        r.bind(t, i);
    };
    var $r = function(e, t, n, r, i) {
        var o;
        if (void 0 === r && (r = !0), void 0 === i && (i = !1), "top" === t) o = [ "contentHeight", "containerHeight", "scrollTop", "y", "up", "down" ]; else {
            if ("left" !== t) throw new Error("A proper axis should be provided");
            o = [ "contentWidth", "containerWidth", "scrollLeft", "x", "left", "right" ];
        }
        !function(e, t, n, r, i) {
            var o = n[0], a = n[1], s = n[2], c = n[3], l = n[4], u = n[5];
            void 0 === r && (r = !0);
            void 0 === i && (i = !1);
            var d = e.element;
            e.reach[c] = null, d[s] < 1 && (e.reach[c] = "start");
            d[s] > e[o] - e[a] - 1 && (e.reach[c] = "end");
            t && (d.dispatchEvent(Qr("ps-scroll-" + c)), t < 0 ? d.dispatchEvent(Qr("ps-scroll-" + l)) : t > 0 && d.dispatchEvent(Qr("ps-scroll-" + u)), 
            r && function(e, t) {
                Kr(e, t), Vr(e, t);
            }(e, c));
            e.reach[c] && (t || i) && d.dispatchEvent(Qr("ps-" + c + "-reach-" + e.reach[c]));
        }(e, n, o, r, i);
    };
    function M(e) {
        return parseInt(e, 10) || 0;
    }
    var ei = {
        isWebKit: "undefined" != typeof document && "WebkitAppearance" in document.documentElement.style,
        supportsTouch: "undefined" != typeof window && ("ontouchstart" in window || window.DocumentTouch && document instanceof window.DocumentTouch),
        supportsIePointer: "undefined" != typeof navigator && navigator.msMaxTouchPoints,
        isChrome: "undefined" != typeof navigator && /Chrome/i.test(navigator && navigator.userAgent)
    }, O = function(e) {
        var t = e.element;
        e.containerWidth = t.clientWidth, e.containerHeight = t.clientHeight, e.contentWidth = t.scrollWidth, 
        e.contentHeight = t.scrollHeight, t.contains(e.scrollbarXRail) || (Gr(t, A.element.rail("x")).forEach(function(e) {
            return Yr(e);
        }), t.appendChild(e.scrollbarXRail)), t.contains(e.scrollbarYRail) || (Gr(t, A.element.rail("y")).forEach(function(e) {
            return Yr(e);
        }), t.appendChild(e.scrollbarYRail)), !e.settings.suppressScrollX && e.containerWidth + e.settings.scrollXMarginOffset < e.contentWidth ? (e.scrollbarXActive = !0, 
        e.railXWidth = e.containerWidth - e.railXMarginWidth, e.railXRatio = e.containerWidth / e.railXWidth, 
        e.scrollbarXWidth = ti(e, M(e.railXWidth * e.containerWidth / e.contentWidth)), 
        e.scrollbarXLeft = M((e.negativeScrollAdjustment + t.scrollLeft) * (e.railXWidth - e.scrollbarXWidth) / (e.contentWidth - e.containerWidth))) : e.scrollbarXActive = !1, 
        !e.settings.suppressScrollY && e.containerHeight + e.settings.scrollYMarginOffset < e.contentHeight ? (e.scrollbarYActive = !0, 
        e.railYHeight = e.containerHeight - e.railYMarginHeight, e.railYRatio = e.containerHeight / e.railYHeight, 
        e.scrollbarYHeight = ti(e, M(e.railYHeight * e.containerHeight / e.contentHeight)), 
        e.scrollbarYTop = M(t.scrollTop * (e.railYHeight - e.scrollbarYHeight) / (e.contentHeight - e.containerHeight))) : e.scrollbarYActive = !1, 
        e.scrollbarXLeft >= e.railXWidth - e.scrollbarXWidth && (e.scrollbarXLeft = e.railXWidth - e.scrollbarXWidth), 
        e.scrollbarYTop >= e.railYHeight - e.scrollbarYHeight && (e.scrollbarYTop = e.railYHeight - e.scrollbarYHeight), 
        function(e, t) {
            var n = {
                width: t.railXWidth
            };
            t.isRtl ? n.left = t.negativeScrollAdjustment + e.scrollLeft + t.containerWidth - t.contentWidth : n.left = e.scrollLeft;
            t.isScrollbarXUsingBottom ? n.bottom = t.scrollbarXBottom - e.scrollTop : n.top = t.scrollbarXTop + e.scrollTop;
            L(t.scrollbarXRail, n);
            var r = {
                top: e.scrollTop,
                height: t.railYHeight
            };
            t.isScrollbarYUsingRight ? t.isRtl ? r.right = t.contentWidth - (t.negativeScrollAdjustment + e.scrollLeft) - t.scrollbarYRight - t.scrollbarYOuterWidth : r.right = t.scrollbarYRight - e.scrollLeft : t.isRtl ? r.left = t.negativeScrollAdjustment + e.scrollLeft + 2 * t.containerWidth - t.contentWidth - t.scrollbarYLeft - t.scrollbarYOuterWidth : r.left = t.scrollbarYLeft + e.scrollLeft;
            L(t.scrollbarYRail, r), L(t.scrollbarX, {
                left: t.scrollbarXLeft,
                width: t.scrollbarXWidth - t.railBorderXWidth
            }), L(t.scrollbarY, {
                top: t.scrollbarYTop,
                height: t.scrollbarYHeight - t.railBorderYWidth
            });
        }(t, e), e.scrollbarXActive ? t.classList.add(A.state.active("x")) : (t.classList.remove(A.state.active("x")), 
        e.scrollbarXWidth = 0, e.scrollbarXLeft = 0, t.scrollLeft = 0), e.scrollbarYActive ? t.classList.add(A.state.active("y")) : (t.classList.remove(A.state.active("y")), 
        e.scrollbarYHeight = 0, e.scrollbarYTop = 0, t.scrollTop = 0);
    };
    function ti(e, t) {
        return e.settings.minScrollbarLength && (t = Math.max(t, e.settings.minScrollbarLength)), 
        e.settings.maxScrollbarLength && (t = Math.min(t, e.settings.maxScrollbarLength)), 
        t;
    }
    function ni(t, e) {
        var n = e[0], r = e[1], i = e[2], o = e[3], a = e[4], s = e[5], c = e[6], l = e[7], u = t.element, d = null, f = null, h = null;
        function p(e) {
            u[c] = d + h * (e[i] - f), Kr(t, l), O(t), e.stopPropagation(), e.preventDefault();
        }
        function g() {
            Vr(t, l), t.event.unbind(t.ownerDocument, "mousemove", p);
        }
        t.event.bind(t[a], "mousedown", function(e) {
            d = u[c], f = e[i], h = (t[r] - t[n]) / (t[o] - t[s]), t.event.bind(t.ownerDocument, "mousemove", p), 
            t.event.once(t.ownerDocument, "mouseup", g), e.stopPropagation(), e.preventDefault();
        });
    }
    var ri = {
        "click-rail": function(n) {
            n.event.bind(n.scrollbarY, "mousedown", function(e) {
                return e.stopPropagation();
            }), n.event.bind(n.scrollbarYRail, "mousedown", function(e) {
                var t = e.pageY - window.pageYOffset - n.scrollbarYRail.getBoundingClientRect().top > n.scrollbarYTop ? 1 : -1;
                n.element.scrollTop += t * n.containerHeight, O(n), e.stopPropagation();
            }), n.event.bind(n.scrollbarX, "mousedown", function(e) {
                return e.stopPropagation();
            }), n.event.bind(n.scrollbarXRail, "mousedown", function(e) {
                var t = e.pageX - window.pageXOffset - n.scrollbarXRail.getBoundingClientRect().left > n.scrollbarXLeft ? 1 : -1;
                n.element.scrollLeft += t * n.containerWidth, O(n), e.stopPropagation();
            });
        },
        "drag-thumb": function(e) {
            ni(e, [ "containerWidth", "contentWidth", "pageX", "railXWidth", "scrollbarX", "scrollbarXWidth", "scrollLeft", "x" ]), 
            ni(e, [ "containerHeight", "contentHeight", "pageY", "railYHeight", "scrollbarY", "scrollbarYHeight", "scrollTop", "y" ]);
        },
        keyboard: function(o) {
            var a = o.element;
            o.event.bind(o.ownerDocument, "keydown", function(e) {
                if (!(e.isDefaultPrevented && e.isDefaultPrevented() || e.defaultPrevented) && (Wr(a, ":hover") || Wr(o.scrollbarX, ":focus") || Wr(o.scrollbarY, ":focus"))) {
                    var t, n = document.activeElement ? document.activeElement : o.ownerDocument.activeElement;
                    if (n) {
                        if ("IFRAME" === n.tagName) n = n.contentDocument.activeElement; else for (;n.shadowRoot; ) n = n.shadowRoot.activeElement;
                        if (Wr(t = n, "input,[contenteditable]") || Wr(t, "select,[contenteditable]") || Wr(t, "textarea,[contenteditable]") || Wr(t, "button,[contenteditable]")) return;
                    }
                    var r = 0, i = 0;
                    switch (e.which) {
                      case 37:
                        r = e.metaKey ? -o.contentWidth : e.altKey ? -o.containerWidth : -30;
                        break;

                      case 38:
                        i = e.metaKey ? o.contentHeight : e.altKey ? o.containerHeight : 30;
                        break;

                      case 39:
                        r = e.metaKey ? o.contentWidth : e.altKey ? o.containerWidth : 30;
                        break;

                      case 40:
                        i = e.metaKey ? -o.contentHeight : e.altKey ? -o.containerHeight : -30;
                        break;

                      case 32:
                        i = e.shiftKey ? o.containerHeight : -o.containerHeight;
                        break;

                      case 33:
                        i = o.containerHeight;
                        break;

                      case 34:
                        i = -o.containerHeight;
                        break;

                      case 36:
                        i = o.contentHeight;
                        break;

                      case 35:
                        i = -o.contentHeight;
                        break;

                      default:
                        return;
                    }
                    o.settings.suppressScrollX && 0 !== r || o.settings.suppressScrollY && 0 !== i || (a.scrollTop -= i, 
                    a.scrollLeft += r, O(o), function(e, t) {
                        var n = a.scrollTop;
                        if (0 === e) {
                            if (!o.scrollbarYActive) return !1;
                            if (0 === n && t > 0 || n >= o.contentHeight - o.containerHeight && t < 0) return !o.settings.wheelPropagation;
                        }
                        var r = a.scrollLeft;
                        if (0 === t) {
                            if (!o.scrollbarXActive) return !1;
                            if (0 === r && e < 0 || r >= o.contentWidth - o.containerWidth && e > 0) return !o.settings.wheelPropagation;
                        }
                        return !0;
                    }(r, i) && e.preventDefault());
                }
            });
        },
        wheel: function(a) {
            var s = a.element;
            function e(e) {
                var t = function(e) {
                    var t = e.deltaX, n = -1 * e.deltaY;
                    return void 0 !== t && void 0 !== n || (t = -1 * e.wheelDeltaX / 6, 
                    n = e.wheelDeltaY / 6), e.deltaMode && 1 === e.deltaMode && (t *= 10, 
                    n *= 10), t != t && n != n && (t = 0, n = e.wheelDelta), e.shiftKey ? [ -n, -t ] : [ t, n ];
                }(e), n = t[0], r = t[1];
                if (!function(e, t, n) {
                    if (!ei.isWebKit && s.querySelector("select:focus")) return !0;
                    if (!s.contains(e)) return !1;
                    for (var r = e; r && r !== s; ) {
                        if (r.classList.contains(A.element.consuming)) return !0;
                        var i = _(r);
                        if ([ i.overflow, i.overflowX, i.overflowY ].join("").match(/(scroll|auto)/)) {
                            var o = r.scrollHeight - r.clientHeight;
                            if (o > 0 && !(0 === r.scrollTop && n > 0 || r.scrollTop === o && n < 0)) return !0;
                            var a = r.scrollLeft - r.clientWidth;
                            if (a > 0 && !(0 === r.scrollLeft && t < 0 || r.scrollLeft === a && t > 0)) return !0;
                        }
                        r = r.parentNode;
                    }
                    return !1;
                }(e.target, n, r)) {
                    var i = !1;
                    a.settings.useBothWheelAxes ? a.scrollbarYActive && !a.scrollbarXActive ? (r ? s.scrollTop -= r * a.settings.wheelSpeed : s.scrollTop += n * a.settings.wheelSpeed, 
                    i = !0) : a.scrollbarXActive && !a.scrollbarYActive && (n ? s.scrollLeft += n * a.settings.wheelSpeed : s.scrollLeft -= r * a.settings.wheelSpeed, 
                    i = !0) : (s.scrollTop -= r * a.settings.wheelSpeed, s.scrollLeft += n * a.settings.wheelSpeed), 
                    O(a), (i = i || function(e, t) {
                        var n = 0 === s.scrollTop, r = s.scrollTop + s.offsetHeight === s.scrollHeight, i = 0 === s.scrollLeft, o = s.scrollLeft + s.offsetWidth === s.offsetWidth;
                        return !(Math.abs(t) > Math.abs(e) ? n || r : i || o) || !a.settings.wheelPropagation;
                    }(n, r)) && !e.ctrlKey && (e.stopPropagation(), e.preventDefault());
                }
            }
            void 0 !== window.onwheel ? a.event.bind(s, "wheel", e) : void 0 !== window.onmousewheel && a.event.bind(s, "mousewheel", e);
        },
        touch: function(s) {
            if (ei.supportsTouch || ei.supportsIePointer) {
                var c = s.element, l = {}, u = 0, d = {}, n = null;
                ei.supportsTouch ? (s.event.bind(c, "touchstart", e), s.event.bind(c, "touchmove", t), 
                s.event.bind(c, "touchend", r)) : ei.supportsIePointer && (window.PointerEvent ? (s.event.bind(c, "pointerdown", e), 
                s.event.bind(c, "pointermove", t), s.event.bind(c, "pointerup", r)) : window.MSPointerEvent && (s.event.bind(c, "MSPointerDown", e), 
                s.event.bind(c, "MSPointerMove", t), s.event.bind(c, "MSPointerUp", r)));
            }
            function f(e, t) {
                c.scrollTop -= t, c.scrollLeft -= e, O(s);
            }
            function h(e) {
                return e.targetTouches ? e.targetTouches[0] : e;
            }
            function p(e) {
                return !(e.pointerType && "pen" === e.pointerType && 0 === e.buttons || (!e.targetTouches || 1 !== e.targetTouches.length) && (!e.pointerType || "mouse" === e.pointerType || e.pointerType === e.MSPOINTER_TYPE_MOUSE));
            }
            function e(e) {
                if (p(e)) {
                    var t = h(e);
                    l.pageX = t.pageX, l.pageY = t.pageY, u = new Date().getTime(), 
                    null !== n && clearInterval(n);
                }
            }
            function t(e) {
                if (p(e)) {
                    var t = h(e), n = {
                        pageX: t.pageX,
                        pageY: t.pageY
                    }, r = n.pageX - l.pageX, i = n.pageY - l.pageY;
                    if (function(e, t, n) {
                        if (!c.contains(e)) return !1;
                        for (var r = e; r && r !== c; ) {
                            if (r.classList.contains(A.element.consuming)) return !0;
                            var i = _(r);
                            if ([ i.overflow, i.overflowX, i.overflowY ].join("").match(/(scroll|auto)/)) {
                                var o = r.scrollHeight - r.clientHeight;
                                if (o > 0 && !(0 === r.scrollTop && n > 0 || r.scrollTop === o && n < 0)) return !0;
                                var a = r.scrollLeft - r.clientWidth;
                                if (a > 0 && !(0 === r.scrollLeft && t < 0 || r.scrollLeft === a && t > 0)) return !0;
                            }
                            r = r.parentNode;
                        }
                        return !1;
                    }(e.target, r, i)) return;
                    f(r, i), l = n;
                    var o = new Date().getTime(), a = o - u;
                    a > 0 && (d.x = r / a, d.y = i / a, u = o), function(e, t) {
                        var n = c.scrollTop, r = c.scrollLeft, i = Math.abs(e), o = Math.abs(t);
                        if (o > i) {
                            if (t < 0 && n === s.contentHeight - s.containerHeight || t > 0 && 0 === n) return 0 === window.scrollY && t > 0 && ei.isChrome;
                        } else if (i > o && (e < 0 && r === s.contentWidth - s.containerWidth || e > 0 && 0 === r)) return !0;
                        return !0;
                    }(r, i) && e.preventDefault();
                }
            }
            function r() {
                s.settings.swipeEasing && (clearInterval(n), n = setInterval(function() {
                    s.isInitialized ? clearInterval(n) : d.x || d.y ? Math.abs(d.x) < .01 && Math.abs(d.y) < .01 ? clearInterval(n) : (f(30 * d.x, 30 * d.y), 
                    d.x *= .8, d.y *= .8) : clearInterval(n);
                }, 10));
            }
        }
    }, ii = function(e, t) {
        var n = this;
        if (void 0 === t && (t = {}), "string" == typeof e && (e = document.querySelector(e)), 
        !e || !e.nodeName) throw new Error("no element is specified to initialize PerfectScrollbar");
        for (var r in this.element = e, e.classList.add(A.main), this.settings = {
            handlers: [ "click-rail", "drag-thumb", "keyboard", "wheel", "touch" ],
            maxScrollbarLength: null,
            minScrollbarLength: null,
            scrollingThreshold: 1e3,
            scrollXMarginOffset: 0,
            scrollYMarginOffset: 0,
            suppressScrollX: !1,
            suppressScrollY: !1,
            swipeEasing: !0,
            useBothWheelAxes: !1,
            wheelPropagation: !1,
            wheelSpeed: 1
        }, t) n.settings[r] = t[r];
        this.containerWidth = null, this.containerHeight = null, this.contentWidth = null, 
        this.contentHeight = null;
        var i, o, a = function() {
            return e.classList.add(A.state.focus);
        }, s = function() {
            return e.classList.remove(A.state.focus);
        };
        this.isRtl = "rtl" === _(e).direction, this.isNegativeScroll = (o = e.scrollLeft, 
        e.scrollLeft = -1, i = e.scrollLeft < 0, e.scrollLeft = o, i), this.negativeScrollAdjustment = this.isNegativeScroll ? e.scrollWidth - e.clientWidth : 0, 
        this.event = new Zr(), this.ownerDocument = e.ownerDocument || document, 
        this.scrollbarXRail = jr(A.element.rail("x")), e.appendChild(this.scrollbarXRail), 
        this.scrollbarX = jr(A.element.thumb("x")), this.scrollbarXRail.appendChild(this.scrollbarX), 
        this.scrollbarX.setAttribute("tabindex", 0), this.event.bind(this.scrollbarX, "focus", a), 
        this.event.bind(this.scrollbarX, "blur", s), this.scrollbarXActive = null, 
        this.scrollbarXWidth = null, this.scrollbarXLeft = null;
        var c = _(this.scrollbarXRail);
        this.scrollbarXBottom = parseInt(c.bottom, 10), isNaN(this.scrollbarXBottom) ? (this.isScrollbarXUsingBottom = !1, 
        this.scrollbarXTop = M(c.top)) : this.isScrollbarXUsingBottom = !0, this.railBorderXWidth = M(c.borderLeftWidth) + M(c.borderRightWidth), 
        L(this.scrollbarXRail, {
            display: "block"
        }), this.railXMarginWidth = M(c.marginLeft) + M(c.marginRight), L(this.scrollbarXRail, {
            display: ""
        }), this.railXWidth = null, this.railXRatio = null, this.scrollbarYRail = jr(A.element.rail("y")), 
        e.appendChild(this.scrollbarYRail), this.scrollbarY = jr(A.element.thumb("y")), 
        this.scrollbarYRail.appendChild(this.scrollbarY), this.scrollbarY.setAttribute("tabindex", 0), 
        this.event.bind(this.scrollbarY, "focus", a), this.event.bind(this.scrollbarY, "blur", s), 
        this.scrollbarYActive = null, this.scrollbarYHeight = null, this.scrollbarYTop = null;
        var l = _(this.scrollbarYRail);
        this.scrollbarYRight = parseInt(l.right, 10), isNaN(this.scrollbarYRight) ? (this.isScrollbarYUsingRight = !1, 
        this.scrollbarYLeft = M(l.left)) : this.isScrollbarYUsingRight = !0, this.scrollbarYOuterWidth = this.isRtl ? function(e) {
            var t = _(e);
            return M(t.width) + M(t.paddingLeft) + M(t.paddingRight) + M(t.borderLeftWidth) + M(t.borderRightWidth);
        }(this.scrollbarY) : null, this.railBorderYWidth = M(l.borderTopWidth) + M(l.borderBottomWidth), 
        L(this.scrollbarYRail, {
            display: "block"
        }), this.railYMarginHeight = M(l.marginTop) + M(l.marginBottom), L(this.scrollbarYRail, {
            display: ""
        }), this.railYHeight = null, this.railYRatio = null, this.reach = {
            x: e.scrollLeft <= 0 ? "start" : e.scrollLeft >= this.contentWidth - this.containerWidth ? "end" : null,
            y: e.scrollTop <= 0 ? "start" : e.scrollTop >= this.contentHeight - this.containerHeight ? "end" : null
        }, this.isAlive = !0, this.settings.handlers.forEach(function(e) {
            return ri[e](n);
        }), this.lastScrollTop = e.scrollTop, this.lastScrollLeft = e.scrollLeft, 
        this.event.bind(this.element, "scroll", function(e) {
            return n.onScroll(e);
        }), O(this);
    };
    ii.prototype.update = function() {
        this.isAlive && (this.negativeScrollAdjustment = this.isNegativeScroll ? this.element.scrollWidth - this.element.clientWidth : 0, 
        L(this.scrollbarXRail, {
            display: "block"
        }), L(this.scrollbarYRail, {
            display: "block"
        }), this.railXMarginWidth = M(_(this.scrollbarXRail).marginLeft) + M(_(this.scrollbarXRail).marginRight), 
        this.railYMarginHeight = M(_(this.scrollbarYRail).marginTop) + M(_(this.scrollbarYRail).marginBottom), 
        L(this.scrollbarXRail, {
            display: "none"
        }), L(this.scrollbarYRail, {
            display: "none"
        }), O(this), $r(this, "top", 0, !1, !0), $r(this, "left", 0, !1, !0), L(this.scrollbarXRail, {
            display: ""
        }), L(this.scrollbarYRail, {
            display: ""
        }));
    }, ii.prototype.onScroll = function(e) {
        this.isAlive && (O(this), $r(this, "top", this.element.scrollTop - this.lastScrollTop), 
        $r(this, "left", this.element.scrollLeft - this.lastScrollLeft), this.lastScrollTop = this.element.scrollTop, 
        this.lastScrollLeft = this.element.scrollLeft);
    }, ii.prototype.destroy = function() {
        this.isAlive && (this.event.unbindAll(), Yr(this.scrollbarX), Yr(this.scrollbarY), 
        Yr(this.scrollbarXRail), Yr(this.scrollbarYRail), this.removePsClasses(), 
        this.element = null, this.scrollbarX = null, this.scrollbarY = null, this.scrollbarXRail = null, 
        this.scrollbarYRail = null, this.isAlive = !1);
    }, ii.prototype.removePsClasses = function() {
        this.element.className = this.element.className.split(" ").filter(function(e) {
            return !e.match(/^ps([-_].+|)$/);
        }).join(" ");
    };
    var oi = function(e) {
        var t;
        if ("SELECT" === e.nodeName) e.focus(), t = e.value; else if ("INPUT" === e.nodeName || "TEXTAREA" === e.nodeName) {
            var n = e.hasAttribute("readonly");
            n || e.setAttribute("readonly", ""), e.select(), e.setSelectionRange(0, e.value.length), 
            n || e.removeAttribute("readonly"), t = e.value;
        } else {
            e.hasAttribute("contenteditable") && e.focus();
            var r = window.getSelection(), i = document.createRange();
            i.selectNodeContents(e), r.removeAllRanges(), r.addRange(i), t = r.toString();
        }
        return t;
    }, ai = t(function(e, t) {
        !function(e, t) {
            var n, r = (n = t) && n.__esModule ? n : {
                default: n
            }, i = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
                return typeof e;
            } : function(e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
            }, o = function() {
                function r(e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var r = t[n];
                        r.enumerable = r.enumerable || !1, r.configurable = !0, 
                        "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
                    }
                }
                return function(e, t, n) {
                    return t && r(e.prototype, t), n && r(e, n), e;
                };
            }(), a = function() {
                function t(e) {
                    !function(e, t) {
                        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
                    }(this, t), this.resolveOptions(e), this.initSelection();
                }
                return o(t, [ {
                    key: "resolveOptions",
                    value: function() {
                        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                        this.action = e.action, this.container = e.container, this.emitter = e.emitter, 
                        this.target = e.target, this.text = e.text, this.trigger = e.trigger, 
                        this.selectedText = "";
                    }
                }, {
                    key: "initSelection",
                    value: function() {
                        this.text ? this.selectFake() : this.target && this.selectTarget();
                    }
                }, {
                    key: "selectFake",
                    value: function() {
                        var e = this, t = "rtl" == document.documentElement.getAttribute("dir");
                        this.removeFake(), this.fakeHandlerCallback = function() {
                            return e.removeFake();
                        }, this.fakeHandler = this.container.addEventListener("click", this.fakeHandlerCallback) || !0, 
                        this.fakeElem = document.createElement("textarea"), this.fakeElem.style.fontSize = "12pt", 
                        this.fakeElem.style.border = "0", this.fakeElem.style.padding = "0", 
                        this.fakeElem.style.margin = "0", this.fakeElem.style.position = "absolute", 
                        this.fakeElem.style[t ? "right" : "left"] = "-9999px";
                        var n = window.pageYOffset || document.documentElement.scrollTop;
                        this.fakeElem.style.top = n + "px", this.fakeElem.setAttribute("readonly", ""), 
                        this.fakeElem.value = this.text, this.container.appendChild(this.fakeElem), 
                        this.selectedText = (0, r.default)(this.fakeElem), this.copyText();
                    }
                }, {
                    key: "removeFake",
                    value: function() {
                        this.fakeHandler && (this.container.removeEventListener("click", this.fakeHandlerCallback), 
                        this.fakeHandler = null, this.fakeHandlerCallback = null), 
                        this.fakeElem && (this.container.removeChild(this.fakeElem), 
                        this.fakeElem = null);
                    }
                }, {
                    key: "selectTarget",
                    value: function() {
                        this.selectedText = (0, r.default)(this.target), this.copyText();
                    }
                }, {
                    key: "copyText",
                    value: function() {
                        var t = void 0;
                        try {
                            t = document.execCommand(this.action);
                        } catch (e) {
                            t = !1;
                        }
                        this.handleResult(t);
                    }
                }, {
                    key: "handleResult",
                    value: function(e) {
                        this.emitter.emit(e ? "success" : "error", {
                            action: this.action,
                            text: this.selectedText,
                            trigger: this.trigger,
                            clearSelection: this.clearSelection.bind(this)
                        });
                    }
                }, {
                    key: "clearSelection",
                    value: function() {
                        this.trigger && this.trigger.focus(), window.getSelection().removeAllRanges();
                    }
                }, {
                    key: "destroy",
                    value: function() {
                        this.removeFake();
                    }
                }, {
                    key: "action",
                    set: function() {
                        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "copy";
                        if (this._action = e, "copy" !== this._action && "cut" !== this._action) throw new Error('Invalid "action" value, use either "copy" or "cut"');
                    },
                    get: function() {
                        return this._action;
                    }
                }, {
                    key: "target",
                    set: function(e) {
                        if (void 0 !== e) {
                            if (!e || "object" !== (void 0 === e ? "undefined" : i(e)) || 1 !== e.nodeType) throw new Error('Invalid "target" value, use a valid Element');
                            if ("copy" === this.action && e.hasAttribute("disabled")) throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');
                            if ("cut" === this.action && (e.hasAttribute("readonly") || e.hasAttribute("disabled"))) throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes');
                            this._target = e;
                        }
                    },
                    get: function() {
                        return this._target;
                    }
                } ]), t;
            }();
            e.exports = a;
        }(e, oi);
    });
    function si() {}
    N(ai), si.prototype = {
        on: function(e, t, n) {
            var r = this.e || (this.e = {});
            return (r[e] || (r[e] = [])).push({
                fn: t,
                ctx: n
            }), this;
        },
        once: function(e, t, n) {
            var r = this;
            function i() {
                r.off(e, i), t.apply(n, arguments);
            }
            return i._ = t, this.on(e, i, n);
        },
        emit: function(e) {
            for (var t = [].slice.call(arguments, 1), n = ((this.e || (this.e = {}))[e] || []).slice(), r = 0, i = n.length; r < i; r++) n[r].fn.apply(n[r].ctx, t);
            return this;
        },
        off: function(e, t) {
            var n = this.e || (this.e = {}), r = n[e], i = [];
            if (r && t) for (var o = 0, a = r.length; o < a; o++) r[o].fn !== t && r[o].fn._ !== t && i.push(r[o]);
            return i.length ? n[e] = i : delete n[e], this;
        }
    };
    var ci = si, r = t(function(e, n) {
        n.node = function(e) {
            return void 0 !== e && e instanceof HTMLElement && 1 === e.nodeType;
        }, n.nodeList = function(e) {
            var t = Object.prototype.toString.call(e);
            return void 0 !== e && ("[object NodeList]" === t || "[object HTMLCollection]" === t) && "length" in e && (0 === e.length || n.node(e[0]));
        }, n.string = function(e) {
            return "string" == typeof e || e instanceof String;
        }, n.fn = function(e) {
            return "[object Function]" === Object.prototype.toString.call(e);
        };
    }), li = (r.node, r.nodeList, r.string, r.fn, 9);
    if ("undefined" != typeof Element && !Element.prototype.matches) {
        var ui = Element.prototype;
        ui.matches = ui.matchesSelector || ui.mozMatchesSelector || ui.msMatchesSelector || ui.oMatchesSelector || ui.webkitMatchesSelector;
    }
    var di = function(e, t) {
        for (;e && e.nodeType !== li; ) {
            if ("function" == typeof e.matches && e.matches(t)) return e;
            e = e.parentNode;
        }
    };
    var fi = function(e, t, n, r, i) {
        var o = function(t, n, e, r) {
            return function(e) {
                e.delegateTarget = di(e.target, n), e.delegateTarget && r.call(t, e);
            };
        }.apply(this, arguments);
        return e.addEventListener(n, o, i), {
            destroy: function() {
                e.removeEventListener(n, o, i);
            }
        };
    };
    var hi = function(e, t, n) {
        if (!e && !t && !n) throw new Error("Missing required arguments");
        if (!r.string(t)) throw new TypeError("Second argument must be a String");
        if (!r.fn(n)) throw new TypeError("Third argument must be a Function");
        if (r.node(e)) return function(e, t, n) {
            return e.addEventListener(t, n), {
                destroy: function() {
                    e.removeEventListener(t, n);
                }
            };
        }(e, t, n);
        if (r.nodeList(e)) return function(e, t, n) {
            return Array.prototype.forEach.call(e, function(e) {
                e.addEventListener(t, n);
            }), {
                destroy: function() {
                    Array.prototype.forEach.call(e, function(e) {
                        e.removeEventListener(t, n);
                    });
                }
            };
        }(e, t, n);
        if (r.string(e)) return function(e, t, n) {
            return fi(document.body, e, t, n);
        }(e, t, n);
        throw new TypeError("First argument must be a String, HTMLElement, HTMLCollection, or NodeList");
    }, pi = N(t(function(e, t) {
        !function(e, t, n, r) {
            var i = s(t), o = s(n), a = s(r);
            function s(e) {
                return e && e.__esModule ? e : {
                    default: e
                };
            }
            var c = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
                return typeof e;
            } : function(e) {
                return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
            }, l = function() {
                function r(e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var r = t[n];
                        r.enumerable = r.enumerable || !1, r.configurable = !0, 
                        "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
                    }
                }
                return function(e, t, n) {
                    return t && r(e.prototype, t), n && r(e, n), e;
                };
            }(), u = function(e) {
                function r(e, t) {
                    !function(e, t) {
                        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
                    }(this, r);
                    var n = function(e, t) {
                        if (!e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                        return !t || "object" != typeof t && "function" != typeof t ? e : t;
                    }(this, (r.__proto__ || Object.getPrototypeOf(r)).call(this));
                    return n.resolveOptions(t), n.listenClick(e), n;
                }
                return function(e, t) {
                    if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
                    e.prototype = Object.create(t && t.prototype, {
                        constructor: {
                            value: e,
                            enumerable: !1,
                            writable: !0,
                            configurable: !0
                        }
                    }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
                }(r, e), l(r, [ {
                    key: "resolveOptions",
                    value: function() {
                        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                        this.action = "function" == typeof e.action ? e.action : this.defaultAction, 
                        this.target = "function" == typeof e.target ? e.target : this.defaultTarget, 
                        this.text = "function" == typeof e.text ? e.text : this.defaultText, 
                        this.container = "object" === c(e.container) ? e.container : document.body;
                    }
                }, {
                    key: "listenClick",
                    value: function(e) {
                        var t = this;
                        this.listener = (0, a.default)(e, "click", function(e) {
                            return t.onClick(e);
                        });
                    }
                }, {
                    key: "onClick",
                    value: function(e) {
                        var t = e.delegateTarget || e.currentTarget;
                        this.clipboardAction && (this.clipboardAction = null), this.clipboardAction = new i.default({
                            action: this.action(t),
                            target: this.target(t),
                            text: this.text(t),
                            container: this.container,
                            trigger: t,
                            emitter: this
                        });
                    }
                }, {
                    key: "defaultAction",
                    value: function(e) {
                        return d("action", e);
                    }
                }, {
                    key: "defaultTarget",
                    value: function(e) {
                        var t = d("target", e);
                        if (t) return document.querySelector(t);
                    }
                }, {
                    key: "defaultText",
                    value: function(e) {
                        return d("text", e);
                    }
                }, {
                    key: "destroy",
                    value: function() {
                        this.listener.destroy(), this.clipboardAction && (this.clipboardAction.destroy(), 
                        this.clipboardAction = null);
                    }
                } ], [ {
                    key: "isSupported",
                    value: function() {
                        var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [ "copy", "cut" ], t = "string" == typeof e ? [ e ] : e, n = !!document.queryCommandSupported;
                        return t.forEach(function(e) {
                            n = n && !!document.queryCommandSupported(e);
                        }), n;
                    }
                } ]), r;
            }(o.default);
            function d(e, t) {
                var n = "data-clipboard-" + e;
                if (t.hasAttribute(n)) return t.getAttribute(n);
            }
            e.exports = u;
        }(e, ai, ci, hi);
    }));
    function gi(e) {
        for (var t = e && e.parentNode; t; ) {
            if ("[object ShadowRoot]" === t.toString()) return !0;
            t = t.parentNode;
        }
        return !1;
    }
    function mi(t, n) {
        var r = n.elements;
        r.textElement.addEventListener("click", function(e) {
            return function(e, t, n) {
                var r = n, i = n.elements;
                if (e.target.id !== "prompter-text" + n.randomString) {
                    var o = e.target.id.replace("word-", "").replace(n.randomString, ""), a = JSON.parse(t.exports[l.Exports.JIIX]).words;
                    if (r.wordToChange = a[o], r.wordToChange.id = o, i.candidatesElement.innerHTML = "", 
                    r.wordToChange && r.wordToChange.candidates) {
                        i.candidatesElement.style.display = "flex", r.wordToChange.candidates.forEach(function(e, t) {
                            r.wordToChange.label === e ? i.candidatesElement.innerHTML += '<span id="cdt-' + t + n.randomString + '" class="selected-word">' + e + "</span>" : i.candidatesElement.innerHTML += '<span id="cdt-' + t + n.randomString + '">' + e + "</span>";
                        });
                        var s = e.target.getBoundingClientRect().left - 60;
                        i.candidatesElement.style.top = "48px", i.candidatesElement.style.left = s + "px", 
                        e.target.parentNode.parentNode.parentNode.insertBefore(i.candidatesElement, e.target.parentNode.parentNode);
                    }
                }
            }(e, t, n);
        }), r.candidatesElement.addEventListener("click", function(e) {
            return function(e, t, n) {
                var r = n, i = n.elements, o = e.target.innerText;
                if (o !== r.wordToChange.label && r.wordToChange.candidates.includes(o)) {
                    var a = JSON.parse(t.exports[l.Exports.JIIX]);
                    a.words[r.wordToChange.id].label = o, t.import_(JSON.stringify(a), l.Exports.JIIX);
                }
                i.candidatesElement.style.display = "none";
            }(e, t, n);
        }), r.ellipsisElement.addEventListener("click", function(e) {
            return function(t, e) {
                var n = e, r = function() {
                    var e = t.target.offsetLeft - 68;
                    n.menuElement.style.left = e + "px";
                }, i = document.contains(n.menuElement);
                gi(n.menuElement) || i ? "none" === n.menuElement.style.display && (r(), 
                n.menuElement.style.display = "flex") : (n.menuElement.style.display = "flex", 
                r(), n.menuElement.appendChild(n.convertElement), n.menuElement.appendChild(n.copyElement), 
                n.menuElement.appendChild(n.deleteElement), t.target.parentNode.insertBefore(n.menuElement, t.target));
            }(e, r);
        }), r.copyElement.addEventListener("click", function() {
            r.menuElement.style.display = "none";
        }), r.convertElement.addEventListener("click", function() {
            r.menuElement.style.display = "none", t.convert();
        }), r.deleteElement.addEventListener("click", function() {
            r.menuElement.style.display = "none", t.clear();
        });
    }
    function vi(e) {
        var t = "-" + Math.random().toString(10).substring(2, 12), n = function(e) {
            var t = document.createElement("div");
            t.id = "smartguide" + e, t.classList.add("smartguide");
            var n = document.createElement("div");
            n.id = "prompter-text" + e, n.classList.add("prompter-text"), n.setAttribute("touch-action", "none");
            var r = document.createElement("div");
            r.id = "prompter-text-container" + e, r.classList.add("prompter-text-container"), 
            r.appendChild(n);
            var i = document.createElement("div");
            i.id = "ellipsis" + e, i.classList.add("ellipsis"), i.innerHTML = "...";
            var o = document.createElement("div");
            o.id = "tag-icon" + e, o.classList.add("tag-icon"), o.innerHTML = "&#182;";
            var a = document.createElement("div");
            a.id = "candidates" + e, a.classList.add("candidates");
            var s = document.createElement("div");
            s.id = "more-menu" + e, s.classList.add("more-menu");
            var c = document.createElement("button");
            c.classList.add("options-label-button"), c.id = "convert" + e, c.innerHTML = "Convert";
            var l = document.createElement("button");
            l.classList.add("options-label-button"), l.id = "copy" + e, l.innerHTML = "Copy";
            var u = document.createElement("button");
            return u.classList.add("options-label-button"), u.id = "delete" + e, 
            u.innerHTML = "Delete", {
                smartGuideElement: t,
                textElement: n,
                textContainer: r,
                candidatesElement: a,
                menuElement: s,
                tagElement: o,
                ellipsisElement: i,
                convertElement: c,
                copyElement: l,
                deleteElement: u
            };
        }(t), r = (new pi(n.copyElement), {
            editor: e,
            wordToChange: "",
            lastWord: "",
            previousLabelExport: " ",
            perfectScrollbar: new ii(n.textContainer, {
                suppressScrollY: !0,
                scrollXMarginOffset: 1
            }),
            elements: n,
            smartGuideTimeOutId: 0,
            randomString: t
        });
        return mi(e, r), e.configuration.recognitionParams.v4.text.smartGuideFadeOut.enable && function() {
            var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 1e4, e = arguments[1], n = e, r = e.elements;
            new MutationObserver(function(e) {
                e.forEach(function() {
                    n.smartGuideTimeOutId && clearTimeout(n.smartGuideTimeOutId), 
                    "none" === r.candidatesElement.style.display && "none" === r.menuElement.style.display ? n.smartGuideTimeOutId = setTimeout(function() {
                        r.smartGuideElement.classList.add("smartguide-out"), r.smartGuideElement.classList.remove("smartguide-in");
                    }, t) : document.contains(r.candidatesElement) || document.contains(r.menuElement) || (n.smartGuideTimeOutId = setTimeout(function() {
                        r.smartGuideElement.classList.add("smartguide-out"), r.smartGuideElement.classList.remove("smartguide-in");
                    }, t));
                });
            }).observe(r.smartGuideElement, {
                childList: !0,
                subtree: !0,
                attributes: !0
            });
        }(e.configuration.recognitionParams.v4.text.smartGuideFadeOut.duration, r), 
        r;
    }
    var yi = Object.freeze({
        inkImporter: function(e, t, n, s) {
            var c = e;
            u.debug("inkImporter start importing =>", t);
            var l = Object.assign({}, c.behavior.grabber);
            l.detach = c.behavior.grabber.detach, c.behavior.grabber = {};
            var i = [];
            t.forEach(function(r) {
                r.convert ? i.push({
                    action: "convert",
                    value: !0
                }) : r.setDelay ? i.push({
                    action: "setDelay",
                    value: r.setDelay
                }) : (r.color && i.push({
                    action: "setColor",
                    value: r.color
                }), r.X.forEach(function(e, t) {
                    var n = "move";
                    0 === t ? n = "down" : t === r.X.length - 1 && (n = "up"), i.push({
                        action: n,
                        point: {
                            x: r.X[t],
                            y: r.Y[t]
                        }
                    });
                }));
            }), u.debug("Array of actions =>", i), function e(t, n, r) {
                if (n < t.length) {
                    var i = t[n], o = r;
                    if ("convert" === i.action ? c.convert() : "setDelay" === i.action ? o = i.value : "setColor" === i.action ? c.penStyle = {
                        color: i.value
                    } : (i.point.t = new Date().getTime(), "down" === i.action ? c.pointerDown(i.point) : "up" === i.action ? c.pointerUp(i.point) : "move" === i.action && c.pointerMove(i.point)), 
                    s && n === t.map(function(e) {
                        return e.action;
                    }).lastIndexOf("down") - 1) setTimeout(function() {
                        e(t, n + 1, o);
                    }, s); else if (n === t.length - 1) {
                        var a = new Event("drawEnded");
                        document.dispatchEvent(a), c.behavior.grabber = l;
                    } else setTimeout(function() {
                        e(t, n + 1, o);
                    }, o);
                }
            }(i, 0, n);
        },
        importStrokeGroups: function(n, e) {
            e.forEach(function(t) {
                t.strokes.forEach(function(e) {
                    Be(n.model, e), We(n.model, e, t.penStyle);
                });
            }), n.renderer.drawModel(n.rendererContext, n.model, n.stroker);
        }
    });
    function z(n, r) {
        for (var e = n, t = arguments.length, i = Array(t > 2 ? t - 2 : 0), o = 2; o < t; o++) i[o - 2] = arguments[o];
        i.forEach(function(t) {
            switch (t) {
              case l.EventType.RENDERED:
                break;

              case l.EventType.UNDO:
              case l.EventType.REDO:
              case l.EventType.CLEAR:
              case l.EventType.CONVERT:
              case l.EventType.EXPORT:
                n.callbacks.forEach(function(e) {
                    return e.call(n.domElement, t);
                });
                break;

              case l.EventType.LOADED:
              case l.EventType.CHANGED:
                n.callbacks.forEach(function(e) {
                    return e.call(n.domElement, t, {
                        initialized: n.initialized,
                        canUndo: n.canUndo,
                        canRedo: n.canRedo,
                        canClear: n.canClear,
                        isEmpty: n.isEmpty,
                        possibleUndoCount: n.possibleUndoCount,
                        undoStackIndex: n.undoStackIndex,
                        canConvert: n.canConvert,
                        canExport: n.canExport
                    });
                });
                break;

              case l.EventType.EXPORTED:
                window.clearTimeout(e.notifyTimer), e.notifyTimer = window.setTimeout(function() {
                    n.callbacks.forEach(function(e) {
                        return e.call(n.domElement, t, {
                            exports: n.exports
                        });
                    });
                }, e.configuration.processDelay);
                break;

              case l.EventType.SUPPORTED_IMPORT_MIMETYPES:
                n.callbacks.forEach(function(e) {
                    return e.call(n.domElement, t, {
                        mimeTypes: n.supportedImportMimeTypes
                    });
                });
                break;

              case l.EventType.ERROR:
                n.callbacks.forEach(function(e) {
                    return e.call(n.domElement, t, r);
                });
                break;

              case l.EventType.IDLE:
                n.callbacks.forEach(function(e) {
                    return e.call(n.domElement, t, {
                        idle: n.idle
                    });
                });
                break;

              default:
                u.debug("No valid trigger configured for " + t);
            }
        });
    }
    function bi(e, o, a, t, s) {
        for (var n = arguments.length, c = Array(n > 5 ? n - 5 : 0), r = 5; r < n; r++) c[r - 5] = arguments[r];
        e && ln(a, t) ? (u.debug("Reset is needed"), e(a, t, function(e, t) {
            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
            e ? s.apply(void 0, [ e, t ].concat(r)) : o.apply(void 0, [ a, t, s ].concat(c));
        })) : o.apply(void 0, [ a, t, s ].concat(c));
    }
    function Ei(e, t) {
        var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : e.configuration.triggers[t];
        return !(!e.recognizer || !e.recognizer.getInfo().availableTriggers[t].includes(n)) || (u.error(n + " is not a valid trigger for " + t), 
        !1);
    }
    function xi(e, t) {
        for (var n = e, r = t, i = arguments.length, o = Array(i > 2 ? i - 2 : 0), a = 2; a < i; a++) o[a - 2] = arguments[a];
        u.debug("model changed callback on " + o + " event(s)", t), r.creationTime === e.model.creationTime && (r.rawStrokes.length === e.model.rawStrokes.length && r.lastPositions.lastSentPosition >= e.model.lastPositions.lastReceivedPosition ? (n.model = Qe(n.model, r), 
        (je(n.model) || o.includes(l.EventType.RENDERED)) && e.renderer.drawModel(e.rendererContext, n.model, e.stroker)) : (n.model = r, 
        e.renderer.drawModel(e.rendererContext, n.model, e.stroker)), z.apply(void 0, [ e, void 0 ].concat(o))), 
        "TEXT" === e.configuration.recognitionParams.type && "V4" === e.configuration.recognitionParams.apiVersion && "REST" !== e.configuration.recognitionParams.protocol && e.configuration.recognitionParams.v4.text.mimeTypes.includes(l.Exports.JIIX) && e.configuration.recognitionParams.v4.text.smartGuide && function(e, t) {
            e.smartGuide = function(i, o) {
                var a = i, s = i.elements, e = document.contains(s.smartGuideElement);
                gi(s.smartGuideElement) || e || function(e) {
                    var n = e, r = e.elements, t = 3.779527559 * n.editor.configuration.recognitionParams.v4.text.margin.top, i = 3.779527559 * n.editor.configuration.recognitionParams.v4.text.margin.left;
                    !function(e, t) {
                        r.smartGuideElement.style.top = t + "px", r.smartGuideElement.style.left = e + "px", 
                        r.smartGuideElement.style.visibility = "hidden", n.editor.domElement.insertBefore(r.smartGuideElement, n.editor.loader);
                    }(i, t - 45.354330708), r.smartGuideElement.appendChild(r.tagElement);
                    var o = n.editor.domElement.clientWidth - i - r.tagElement.offsetWidth - 35 - i;
                    (function(e, t) {
                        r.textContainer.style.left = e + "px", r.textContainer.style.width = t + "px", 
                        r.textContainer.style.maxWidth = t + "px", r.smartGuideElement.appendChild(r.textContainer);
                    })(i = r.tagElement.offsetWidth, o), function(e) {
                        r.ellipsisElement.style.left = e + "px", r.smartGuideElement.appendChild(r.ellipsisElement);
                    }(i += o), r.menuElement.style.display = "none", r.menuElement.appendChild(r.convertElement), 
                    r.menuElement.appendChild(r.copyElement), r.menuElement.appendChild(r.deleteElement), 
                    r.smartGuideElement.appendChild(r.menuElement), r.candidatesElement.style.display = "none", 
                    r.smartGuideElement.appendChild(r.candidatesElement), r.smartGuideElement.style.height = "48px", 
                    r.smartGuideElement.style.width = r.tagElement.offsetWidth + r.textContainer.offsetWidth + r.ellipsisElement.offsetWidth + "px", 
                    n.perfectScrollbar.update();
                }(i);
                var c = function(e, t, n) {
                    var r = document.createElement("span");
                    return r.id = "word-" + t + i.randomString, e ? r.innerHTML = "&nbsp;" : r.textContent = n.label, 
                    r;
                };
                if (o && JSON.parse(o[l.Exports.JIIX]).words.length > 0) {
                    if (s.smartGuideElement.classList.add("smartguide-in"), s.smartGuideElement.classList.remove("smartguide-out"), 
                    s.candidatesElement.style.display = "none", s.menuElement.style.display = "none", 
                    a.previousLabelExport && a.previousLabelExport !== JSON.parse(o[l.Exports.JIIX]).label) {
                        var t = JSON.parse(o[l.Exports.JIIX]).words;
                        !function(r) {
                            s.textElement.innerHTML = "";
                            var i = document.createDocumentFragment();
                            r.forEach(function(e, t) {
                                if (" " === e.label || e.label.includes("\n")) i.appendChild(c(!0, t)); else if (t !== r.length - 1) i.appendChild(c(!1, t, e)); else {
                                    s.textElement.appendChild(i), a.perfectScrollbar.update(), 
                                    "" === a.lastWord && (a.lastWord = e);
                                    var n = c(!1, t, e);
                                    a.lastWord.candidates !== e.candidates && a.lastWord.label !== e.label ? (n.classList.add("added-word"), 
                                    s.textElement.appendChild(n), s.textContainer.scrollLeft = n.offsetLeft, 
                                    a.lastWord = e) : (s.textElement.appendChild(n), 
                                    s.textContainer.scrollLeft = n.offsetLeft);
                                }
                            });
                        }(t), function(e) {
                            if (a.tempWords && a.tempWords.length === e.length) {
                                var t = e.map(function(e) {
                                    return e.label;
                                }), n = a.tempWords.map(function(e) {
                                    return e.label;
                                }), r = t.indexOf(t.filter(function(e) {
                                    return -1 === n.indexOf(e);
                                })[0]);
                                document.getElementById("word-" + r + i.randomString) && r > -1 && (document.getElementById("word-" + r + i.randomString).classList.add("modified-word"), 
                                s.textContainer.scrollLeft = document.getElementById("word-" + r + i.randomString).offsetLeft - 10);
                            }
                            a.tempWords = JSON.parse(o[l.Exports.JIIX]).words;
                        }(t);
                    }
                    a.previousLabelExport = JSON.parse(o[l.Exports.JIIX]).label, 
                    s.copyElement.setAttribute("data-clipboard-text", JSON.parse(o[l.Exports.JIIX]).label);
                } else s.smartGuideElement.classList.add("smartguide-out"), s.smartGuideElement.classList.remove("smartguide-in");
                return a;
            }(e.smartGuide, t);
        }(n, r.exports), g(t).length > 0 && !e.recognizer.addStrokes && e.configuration.triggers.exportContent !== l.Trigger.DEMAND && wi(e, t);
    }
    function D(o, e, t) {
        for (var n = arguments.length, a = Array(n > 3 ? n - 3 : 0), r = 3; r < n; r++) a[r - 3] = arguments[r];
        var s = o, i = function(e, t) {
            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
            e ? ("close" !== e.type && u.error("Error while firing the recognition", e.stack || e), 
            "Invalid application key." === e.message || "Invalid HMAC" === e.message || e.error && e.error.result && e.error.result.error && ("InvalidApplicationKeyException" === e.error.result.error || "InvalidHMACSignatureException" === e.error.result.error) || e.code && "access.not.granted" === e.code ? s.error.innerText = l.Error.WRONG_CREDENTIALS : "Session is too old. Max Session Duration Reached" === e.message || e.code && "session.too.old" === e.code ? s.error.innerText = l.Error.TOO_OLD : 1006 !== e.code && 1e3 !== e.code || "none" !== s.error.style.display || (s.error.innerText = l.Error.NOT_REACHABLE), 
            s.error.innerText !== l.Error.TOO_OLD && "CLOSE_RECOGNIZER" !== e.reason || !un(o.recognizerContext) ? (s.error.style.display = "initial", 
            z.apply(void 0, [ o, e, l.EventType.ERROR ].concat(r))) : (u.info("Reconnection is available", e.stack || e), 
            s.error.style.display = "none")) : ("initial" === s.error.style.display && (s.error.style.display = "none"), 
            xi.apply(void 0, [ s, t ].concat(p([].concat(a, r).filter(function(e, t, n) {
                return t === n.indexOf(e);
            })))));
        };
        u.debug("recognition callback"), o.undoRedoManager.updateModel && !e ? o.undoRedoManager.updateModel(o.undoRedoContext, t, i) : i.apply(void 0, [ e, t ].concat(a));
    }
    function wi(o, t, n) {
        var r = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : o.configuration.triggers.exportContent;
        o.recognizer && o.recognizer.export_ && o.recognizerContext.initPromise.then(function() {
            if (Ei(o, "exportContent", r)) {
                var e = o;
                window.clearTimeout(o.exportTimer), e.exportTimer = window.setTimeout(function() {
                    bi(o.recognizer.reset, o.recognizer.export_, o.recognizerContext, t, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        D.apply(void 0, [ o, e, t ].concat(r));
                    }, n);
                }, r === l.Trigger.QUIET_PERIOD ? o.configuration.triggerDelay : 0);
            }
        });
    }
    var Si = function() {
        function o(e, t, n, r, i) {
            Ie(this, o), this.domElement = e, this.domElement.classList.add("ms-editor"), 
            this.loader = document.createElement("div"), this.loader.classList.add("loader"), 
            this.loader = this.domElement.appendChild(this.loader), this.error = document.createElement("div"), 
            this.error.classList.add("error-msg"), this.error = this.domElement.appendChild(this.error), 
            this.exportTimer = void 0, this.resizeTimer = void 0, this.notifyTimer = void 0, 
            this.innerBehaviors = function(e) {
                if (e) {
                    var t = {
                        grabber: e.grabber || I.grabber,
                        rendererList: e.rendererList || I.rendererList,
                        strokerList: e.strokerList || I.strokerList,
                        recognizerList: e.recognizerList || I.recognizerList,
                        callbacks: e.callbacks || I.callbacks,
                        getBehaviorFromConfiguration: e.getBehaviorFromConfiguration || I.getBehaviorFromConfiguration
                    };
                    return u.debug("Override default behaviors", t), t;
                }
                return I;
            }(i), this.configuration = t, this.smartGuide = vi(this), this.localTheme = "", 
            this.theme = r, this.penStyle = n, this.penStyleClasses = "", this.domElement.editor = this;
        }
        return _e(o, [ {
            key: "getStats",
            value: function() {
                return function(e) {
                    var t = {
                        strokesCount: 0,
                        pointsCount: 0,
                        byteSize: 0,
                        humanSize: 0,
                        humanUnit: "BYTE"
                    };
                    if (e.rawStrokes) {
                        t.strokesCount = e.rawStrokes.length;
                        var n = wn(cn({
                            configuration: q
                        }), e);
                        t.pointsCount = e.rawStrokes.map(function(e) {
                            return e.x.length;
                        }).reduce(function(e, t) {
                            return e + t;
                        }, 0);
                        var r = n.textInput.length;
                        t.byteSize = r, r < 270 ? (t.humanUnit = "BYTE", t.byteSize = 0, 
                        t.humanSize = 0) : r < 2048 ? (t.humanUnit = "BYTES", t.humanSize = r) : r < 1048576 ? (t.humanUnit = "KiB", 
                        t.humanSize = (r / 1024).toFixed(2)) : (t.humanUnit = "MiB", 
                        t.humanSize = (r / 1024 / 1024).toFixed(2));
                    }
                    return X.info("Stats", t), t;
                }(this.model);
            }
        }, {
            key: "pointerDown",
            value: function(e) {
                var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "pen", n = arguments[2];
                u.trace("Pointer down", e), window.clearTimeout(this.notifyTimer), 
                window.clearTimeout(this.exportTimer), this.model = Ye(this.model, e, Object.assign({
                    pointerType: t,
                    pointerId: n
                }, this.theme.ink, this.localPenStyle)), this.renderer.drawCurrentStroke(this.rendererContext, this.model, this.stroker);
            }
        }, {
            key: "pointerMove",
            value: function(e) {
                u.trace("Pointer move", e), this.model = Ge(this.model, e), this.renderer.drawCurrentStroke(this.rendererContext, this.model, this.stroker);
            }
        }, {
            key: "pointerUp",
            value: function(e) {
                u.trace("Pointer up", e), this.model = Fe(this.model, e, this.penStyle), 
                this.renderer.drawModel(this.rendererContext, this.model, this.stroker), 
                this.recognizer.addStrokes ? function(o, e) {
                    var t = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : o.configuration.triggers.addStrokes;
                    o.recognizer && o.recognizer.addStrokes && o.recognizerContext.initPromise.then(function() {
                        Ei(o, "addStrokes", t) && bi(o.recognizer.reset, o.recognizer.addStrokes, o.recognizerContext, e, function(e, t) {
                            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                            D.apply(void 0, [ o, e, t ].concat(r));
                        });
                    });
                }(this, this.model) : D(this, void 0, this.model);
            }
        }, {
            key: "removeStroke",
            value: function(n) {
                this.model.strokeGroups.forEach(function(e) {
                    var t = e.strokes.map(function(e) {
                        return JSON.stringify(e);
                    }).indexOf(JSON.stringify(n));
                    -1 !== t && e.strokes.splice(t, 1);
                });
                var e = this.model.rawStrokes.map(function(e) {
                    return JSON.stringify(e);
                }).indexOf(JSON.stringify(n));
                -1 !== e && this.model.rawStrokes.splice(e, 1), this.renderer.drawModel(this.rendererContext, this.model, this.stroker), 
                D(this, void 0, this.model), "DEMAND" !== this.configuration.triggers.exportContent && wi(this, this.model);
            }
        }, {
            key: "reDraw",
            value: function(e, t) {
                var n = this;
                e.forEach(function(e) {
                    Be(n.model, e);
                }), t.forEach(function(t) {
                    t.strokes.forEach(function(e) {
                        We(n.model, e, t.penStyle);
                    });
                }), this.renderer.drawModel(this.rendererContext, this.model, this.stroker), 
                D(this, void 0, this.model);
            }
        }, {
            key: "waitForIdle",
            value: function() {
                var o, e;
                z(this, void 0, l.EventType.IDLE), o = this, e = this.model, o.recognizer && o.recognizer.waitForIdle && o.recognizerContext.initPromise.then(function() {
                    o.recognizer.waitForIdle(o.recognizerContext, e, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        D.apply(void 0, [ o, e, t ].concat(r));
                    });
                });
            }
        }, {
            key: "undo",
            value: function() {
                var o = this;
                u.debug("Undo current model", this.model), z(this, void 0, l.EventType.UNDO), 
                this.undoRedoManager.undo(this.undoRedoContext, this.model, function(e, t) {
                    for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                    xi.apply(void 0, [ o, t ].concat(r));
                });
            }
        }, {
            key: "redo",
            value: function() {
                var o = this;
                u.debug("Redo current model", this.model), z(this, void 0, l.EventType.REDO), 
                this.undoRedoManager.redo(this.undoRedoContext, this.model, function(e, t) {
                    for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                    xi.apply(void 0, [ o, t ].concat(r));
                });
            }
        }, {
            key: "clear",
            value: function() {
                var o = this;
                this.canClear && (u.debug("Clear current model", this.model), z(this, void 0, l.EventType.CLEAR), 
                this.recognizer.clear(this.recognizerContext, this.model, function(e, t) {
                    for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                    D.apply(void 0, [ o, e, t ].concat(r));
                }));
            }
        }, {
            key: "convert",
            value: function() {
                var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "DIGITAL_EDIT";
                this.canConvert && (z(this, void 0, l.EventType.CONVERT), function(o, e, t) {
                    o.recognizer && o.recognizer.convert && o.recognizerContext.initPromise.then(function() {
                        o.recognizer.convert(o.recognizerContext, e, function(e, t) {
                            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                            D.apply(void 0, [ o, e, t ].concat(r));
                        }, t);
                    });
                }(this, this.model, e));
            }
        }, {
            key: "setGuides",
            value: function() {
                var o, e, t = !(arguments.length > 0 && void 0 !== arguments[0]) || arguments[0];
                this.configuration.recognitionParams.v4.text.guides.enable = t, 
                o = this, e = this.model, o.recognizer && o.recognizer.sendConfiguration && o.recognizerContext.initPromise.then(function() {
                    o.recognizer.sendConfiguration(o.recognizerContext, e, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        D.apply(void 0, [ o, e, t ].concat(r));
                    });
                });
            }
        }, {
            key: "export_",
            value: function(e) {
                this.canExport && (z(this, void 0, l.EventType.EXPORT), wi(this, this.model, e, l.Trigger.DEMAND));
            }
        }, {
            key: "import_",
            value: function(e, t) {
                z(this, void 0, l.EventType.IMPORT), function(o, e, t) {
                    o.recognizer && o.recognizer.import_ && o.recognizerContext.initPromise.then(function() {
                        o.recognizer.import_(o.recognizerContext, e, t, function(e, t) {
                            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                            D.apply(void 0, [ o, e, t ].concat(r));
                        });
                    });
                }(this, this.model, e instanceof Blob ? e : new Blob([ e ], {
                    type: t
                }));
            }
        }, {
            key: "getSupportedImportMimeTypes",
            value: function() {
                var o, e;
                o = this, e = this.model, o.recognizer && o.recognizer.getSupportedImportMimeTypes && o.recognizerContext.initPromise.then(function() {
                    o.recognizer.getSupportedImportMimeTypes(o.recognizerContext, e, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        D.apply(void 0, [ o, e, t ].concat(r));
                    });
                });
            }
        }, {
            key: "pointerEvents",
            value: function(e) {
                !function(o, e, t) {
                    o.recognizer && o.recognizer.pointerEvents && o.recognizerContext.initPromise.then(function() {
                        o.recognizer.pointerEvents(o.recognizerContext, e, t, function(e, t) {
                            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                            D.apply(void 0, [ o, e, t ].concat(r));
                        });
                    });
                }(this, this.model, e);
            }
        }, {
            key: "resize",
            value: function() {
                var o, t, e, n, r, i, a;
                u.debug("Resizing editor"), this.renderer.resize(this.rendererContext, this.model, this.stroker, this.configuration.renderingParams.minHeight, this.configuration.renderingParams.minWidth), 
                o = this, t = this.model, o.recognizer && o.recognizer.resize && (o.recognizerContext.initPromise.then(function() {
                    var e = o;
                    window.clearTimeout(o.resizeTimer), e.resizeTimer = window.setTimeout(function() {
                        o.recognizer.resize(o.recognizerContext, t, function(e, t) {
                            for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                            D.apply(void 0, [ o, e, t ].concat(r));
                        }, o.domElement);
                    }, o.configuration.resizeTriggerDelay);
                }), e = o.smartGuide, n = e, r = e.elements, i = 3.779527559 * n.editor.configuration.recognitionParams.v4.text.margin.left, 
                a = n.editor.domElement.clientWidth - i - r.tagElement.offsetWidth - 35 - i, 
                r.textContainer.style.width = a + "px", r.textContainer.style.maxWidth = a + "px", 
                i = r.tagElement.offsetWidth, i += a, r.ellipsisElement.style.left = i + "px", 
                r.smartGuideElement.style.width = r.tagElement.offsetWidth + r.textContainer.offsetWidth + r.ellipsisElement.offsetWidth + "px", 
                n.perfectScrollbar.update());
            }
        }, {
            key: "setThemeForFont",
            value: function(e) {
                var t = !Object.keys(l.Languages).includes(e), n = "hy_AM" === e, r = t || n ? l.Languages.default : l.Languages[e], i = t || n ? "1.2" : "1.8";
                this.theme = {
                    ".text": {
                        "font-family": r,
                        "line-height": i
                    }
                };
            }
        }, {
            key: "unload",
            value: function() {
                this.grabber && this.grabber.detach(this.domElement, this.grabberContext), 
                this.innerRenderer && this.innerRenderer.detach(this.domElement, this.rendererContext);
            }
        }, {
            key: "forceChange",
            value: function() {
                z(this, void 0, l.EventType.CHANGED);
            }
        }, {
            key: "configuration",
            set: function(e) {
                this.loader.style.display = "initial", this.error.style.display = "none", 
                this.innerConfiguration = Z(e), this.setThemeForFont(this.innerConfiguration.recognitionParams.v4.lang), 
                this.behavior = this.behaviors.getBehaviorFromConfiguration(this.behaviors, this.innerConfiguration);
            },
            get: function() {
                return this.innerConfiguration;
            }
        }, {
            key: "penStyle",
            set: function(e) {
                var t, n, o, r;
                this.innerPenStyle = (n = J({}, ee, void 0 === (t = e) ? {} : t), 
                u.debug("Override default pen style", n), n), this.localPenStyle = this.innerPenStyle, 
                o = this, r = this.model, o.recognizer && o.recognizer.setPenStyle && o.recognizerContext.initPromise.then(function() {
                    o.recognizer.setPenStyle(o.recognizerContext, r, o.penStyle, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        D.apply(void 0, [ o, e, t ].concat(r));
                    });
                });
            },
            get: function() {
                return this.innerPenStyle;
            }
        }, {
            key: "penStyleClasses",
            set: function(e) {
                var o, t;
                this.innerPenStyleClasses = e, this.localPenStyle = this.theme["." + this.innerPenStyleClasses], 
                o = this, t = this.model, o.recognizer && o.recognizer.setPenStyleClasses && o.recognizerContext.initPromise.then(function() {
                    o.recognizer.setPenStyleClasses(o.recognizerContext, t, o.penStyleClasses, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        D.apply(void 0, [ o, e, t ].concat(r));
                    });
                });
            },
            get: function() {
                return this.innerPenStyleClasses;
            }
        }, {
            key: "theme",
            set: function(e) {
                var o, t;
                this.innerTheme = function(e) {
                    var t = J({}, re, void 0 === e ? {} : e);
                    return u.debug("Override default theme", t), t;
                }(e), o = this, t = this.model, o.recognizer && o.recognizer.setTheme && o.recognizerContext.initPromise.then(function() {
                    o.recognizer.setTheme(o.recognizerContext, t, o.theme, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        D.apply(void 0, [ o, e, t ].concat(r));
                    });
                });
            },
            get: function() {
                return this.innerTheme;
            }
        }, {
            key: "behaviors",
            get: function() {
                return this.innerBehaviors;
            }
        }, {
            key: "behavior",
            set: function(e) {
                e && (this.grabber && this.grabber.detach(this.domElement, this.grabberContext), 
                this.innerBehavior = e, this.renderer = this.innerBehavior.renderer, 
                this.recognizer = this.innerBehavior.recognizer, this.grabberContext = this.grabber.attach(this.domElement, this));
            },
            get: function() {
                return this.innerBehavior;
            }
        }, {
            key: "recognizer",
            set: function(t) {
                var o = this;
                this.undoRedoContext = {
                    stack: [],
                    currentPosition: -1,
                    maxSize: this.configuration.undoRedoMaxStackSize,
                    canUndo: !1,
                    canRedo: !1
                }, this.undoRedoManager = Ur;
                var a = function(e) {
                    o.innerRecognizer = t, o.innerRecognizer && (o.recognizerContext = cn(o), 
                    o.innerRecognizer.undo && o.innerRecognizer.redo && o.innerRecognizer.clear && (o.undoRedoContext = o.recognizerContext, 
                    o.undoRedoManager = o.innerRecognizer), o.innerRecognizer.init(o.recognizerContext, e, function(e, t) {
                        for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                        u.debug("Recognizer initialized", t), o.loader.style.display = "none", 
                        D.apply(void 0, [ o, e, t ].concat(r));
                    }));
                };
                t && (this.innerRecognizer ? this.innerRecognizer.close(this.recognizerContext, this.model, function(e, t) {
                    for (var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++) r[i - 2] = arguments[i];
                    u.info("Recognizer closed"), D.apply(void 0, [ o, e, t ].concat(r)), 
                    a(Xe(t));
                }) : (this.model = Ue(this.configuration), a(this.model)));
            },
            get: function() {
                return this.innerRecognizer;
            }
        }, {
            key: "renderer",
            set: function(e) {
                e && (this.innerRenderer && this.innerRenderer.detach(this.domElement, this.rendererContext), 
                this.innerRenderer = e, this.innerRenderer && (this.rendererContext = this.innerRenderer.attach(this.domElement, this.configuration.renderingParams.minHeight, this.configuration.renderingParams.minWidth)));
            },
            get: function() {
                return this.innerRenderer;
            }
        }, {
            key: "grabber",
            get: function() {
                return this.behavior ? this.behavior.grabber : void 0;
            }
        }, {
            key: "stroker",
            get: function() {
                return this.behavior ? this.behavior.stroker : void 0;
            }
        }, {
            key: "callbacks",
            get: function() {
                return this.behavior ? this.behavior.callbacks : void 0;
            }
        }, {
            key: "png",
            get: function() {
                return function(e, t) {
                    var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 10;
                    if (e.rawStrokes.length > 0) {
                        var r = Ke(e), i = Xr(r, n), o = Xr(r, n), a = {
                            renderingCanvas: o,
                            renderingCanvasContext: o.getContext("2d"),
                            capturingCanvas: i,
                            capturingCanvasContext: i.getContext("2d")
                        };
                        return a.renderingCanvasContext.translate(-r.minX + n, -r.minY + n), 
                        it(a, e, t), a.renderingCanvas.toDataURL("image/png");
                    }
                    return null;
                }(this.model, this.stroker);
            }
        }, {
            key: "initialized",
            get: function() {
                return !!this.recognizerContext && this.recognizerContext.initialized;
            }
        }, {
            key: "idle",
            get: function() {
                return this.recognizerContext.idle;
            }
        }, {
            key: "canUndo",
            get: function() {
                return this.undoRedoContext.canUndo;
            }
        }, {
            key: "canRedo",
            get: function() {
                return this.undoRedoContext.canRedo;
            }
        }, {
            key: "isEmpty",
            get: function() {
                return this.recognizerContext.isEmpty;
            }
        }, {
            key: "canClear",
            get: function() {
                return this.canUndo && !this.isEmpty;
            }
        }, {
            key: "canConvert",
            get: function() {
                return this.canUndo && this.canClear && this.recognizer && this.recognizer.convert;
            }
        }, {
            key: "possibleUndoCount",
            get: function() {
                return this.recognizerContext.possibleUndoCount;
            }
        }, {
            key: "undoStackIndex",
            get: function() {
                return this.recognizerContext.undoStackIndex;
            }
        }, {
            key: "canExport",
            get: function() {
                return this.canUndo && this.canClear && this.recognizer && this.recognizer.getInfo().availableTriggers.exportContent.includes(l.Trigger.DEMAND);
            }
        }, {
            key: "exports",
            get: function() {
                return this.model ? this.model.exports : void 0;
            }
        }, {
            key: "supportedImportMimeTypes",
            get: function() {
                return this.recognizerContext.supportedImportMimeTypes;
            }
        }, {
            key: "eastereggs",
            get: function() {
                return yi;
            }
        } ]), o;
    }(), Ti = {
        af_ZA: "Afrikaans",
        az_AZ: "Azərbaycanca",
        be_BY: "Беларуская",
        bg_BG: "Български",
        bs_BA: "Bosanski",
        ca_ES: "Català",
        ceb_PH: "Sinugboanon",
        cs_CZ: "Čeština",
        da_DK: "Dansk",
        de_AT: "Deutsch (Österreich)",
        de_DE: "Deutsch",
        el_GR: "Ελληνικά",
        en_CA: "English (Canada)",
        en_GB: "English (United Kingdom)",
        en_PH: "English (Philippines)",
        en_US: "English (United States)",
        es_CO: "Español (Colombia)",
        es_ES: "Español (España)",
        es_MX: "Español (México)",
        et_EE: "Eesti",
        eu_ES: "Euskara",
        fi_FI: "Suomi",
        fil_PH: "Filipino",
        fr_CA: "Français (Canada)",
        fr_FR: "Français (France)",
        ga_IE: "Gaeilge",
        gl_ES: "Galego",
        hr_HR: "Hrvatski",
        hu_HU: "Magyar",
        hy_AM: "Հայերեն",
        id_ID: "Bahasa Indonesia",
        is_IS: "Íslenska",
        it_IT: "Italiano",
        ja_JP: "日本語",
        ka_GE: "ქართული",
        kk_KZ: "Қазақша",
        ko_KR: "한국어",
        lt_LT: "Lietuvių",
        lv_LV: "Latviešu",
        mg_MG: "Malagasy",
        mk_MK: "Македонски",
        mn_MN: "Монгол",
        ms_MY: "Bahasa Melayu (Malaysia)",
        nl_BE: "Nederlands (België)",
        nl_NL: "Nederlands",
        no_NO: "Norsk (Bokmål)",
        pl_PL: "Polski",
        pt_BR: "Português (Brasil)",
        pt_PT: "Português (Portugal)",
        ro_RO: "Română",
        ru_RU: "Русский",
        sk_SK: "Slovenčina",
        sl_SI: "Slovenščina",
        sq_AL: "Shqip",
        sr_Cyrl_RS: "Српски",
        sr_Latn_RS: "Srpski",
        sv_SE: "Svenska",
        sw_TZ: "Kiswahili",
        tr_TR: "Türkçe",
        tt_RU: "Татарча",
        uk_UA: "Українська",
        vi_VN: "Tiếng Việt",
        zh_CN: "中文 (中国)",
        zh_HK: "中文 (香港)",
        zh_TW: "中文 (台灣)"
    }, Ri = {
        result: Ti
    }, Ci = Object.freeze({
        result: Ti,
        default: Ri
    }), ki = {
        af_ZA: "Afrikaans",
        az_AZ: "Azərbaycanca",
        id_ID: "Bahasa Indonesia",
        ms_MY: "Bahasa Melayu (Malaysia)",
        bs_BA: "Bosanski",
        ca_ES: "Català",
        da_DK: "Dansk",
        de_DE: "Deutsch",
        de_AT: "Deutsch (Österreich)",
        et_EE: "Eesti",
        en_CA: "English (Canada)",
        en_GB: "English (United Kingdom)",
        en_US: "English (United States)",
        es_ES: "Español (España)",
        es_MX: "Español (México)",
        eu_ES: "Euskara",
        fr_CA: "Français (Canada)",
        fr_FR: "Français (France)",
        ga_IE: "Gaeilge",
        gl_ES: "Galego",
        hr_HR: "Hrvatski",
        it_IT: "Italiano",
        lv_LV: "Latviešu",
        lt_LT: "Lietuvių",
        hu_HU: "Magyar",
        nl_NL: "Nederlands",
        nl_BE: "Nederlands (België)",
        no_NO: "Norsk (Bokmål)",
        pl_PL: "Polski",
        pt_BR: "Português (Brasil)",
        pt_PT: "Português (Portugal)",
        ro_RO: "Română",
        sq_AL: "Shqip",
        sk_SK: "Slovenčina",
        sl_SI: "Slovenščina",
        sr_Latn_RS: "Srpski",
        fi_FI: "Suomi",
        sv_SE: "Svenska",
        th_TH: "Thaiไทย",
        vi_VN: "Tiếng Việt",
        tr_TR: "Türkçe",
        is_IS: "Íslenska",
        cs_CZ: "Čeština",
        el_GR: "Ελληνικά",
        be_BY: "Беларуская",
        bg_BG: "Български",
        mk_MK: "Македонски",
        mn_MN: "Монгол",
        ru_RU: "Русский",
        sr_Cyrl_RS: "Српски",
        tt_RU: "Татарча",
        uk_UA: "Українська",
        kk_KZ: "Қазақша",
        hy_AM: "Հայերեն",
        he_IL: "עברית",
        ur_PK: "اردو",
        ar: "العربية",
        fa_IR: "فارسی",
        hi_IN: "हिन्दी",
        ka_GE: "ქართული",
        zh_CN: "中文 (中国)",
        zh_TW: "中文 (台灣)",
        zh_HK: "中文 (香港)",
        ja_JP: "日本語",
        ko_KR: "한국어"
    }, Pi = {
        result: ki
    }, Ii = Object.freeze({
        result: ki,
        default: Pi
    });
    function _i(e, t, n, r, i) {
        return u.debug("Registering a new editor"), new Si(e, t, n, r, i);
    }
    function Li(e) {
        return "V4" === Z(e).recognitionParams.apiVersion ? Ci : Ii;
    }
    var Ai = {
        Constants: l,
        DefaultConfiguration: q,
        DefaultBehaviors: I,
        DefaultPenStyle: ee,
        DefaultTheme: re,
        register: _i,
        getAvailableLanguageList: Li,
        LoggerConfig: n,
        Editor: Si,
        InkModel: $e,
        RecognizerContext: pn
    };
    e.default = Ai, e.Constants = l, e.DefaultConfiguration = q, e.DefaultBehaviors = I, 
    e.DefaultPenStyle = ee, e.DefaultTheme = re, e.register = _i, e.getAvailableLanguageList = Li, 
    e.LoggerConfig = n, e.Editor = Si, e.InkModel = $e, e.RecognizerContext = pn, 
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
});