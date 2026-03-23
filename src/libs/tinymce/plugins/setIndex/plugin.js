/**
 * 打开文档
 */
tinymce.PluginManager.add('indexMarker', function(editor, url) {
    var global$1 = tinymce.util.Tools.resolve('tinymce.dom.TreeWalker');
	var global$2 = tinymce.util.Tools.resolve('tinymce.util.Tools');
    var constant = function (value) {
        return function () {
            return value;
        };
    };
    var identity = function (x) {
        return x;
    };
    var noop = function () {};

    var DOCUMENT = 9;
    var DOCUMENT_FRAGMENT = 11;
    var ELEMENT = 1;
    var TEXT = 3;
    var type = function (element) {
        return element.dom.nodeType;
    };
    var isType = function (t) {
        return function (element) {
            return type(element) === t;
        };
    };
    var isType$1 = function (type) {
        return function (value) {
            return typeOf(value) === type;
        };
    };
    var isSimpleType = function (type) {
        return function (value) {
            return typeof value === type;
        };
    };

    var isText$1 = isType(TEXT);
    var isString = isType$1('string');
    var isArray = isType$1('array');
    var isBoolean = isSimpleType('boolean');
    var isNumber = isSimpleType('number');

    var never = constant(false);
    var always = constant(true);
    var punctuationStr = '[!-#%-*,-\\/:;?@\\[-\\]_{}\xA1\xAB\xB7\xBB\xBF;\xB7\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1361-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u3008\u3009\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30\u2E31\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uff3f\uFF5B\uFF5D\uFF5F-\uFF65]';
    var punctuation$1 = constant(punctuationStr);
    var punctuation = punctuation$1;

    var fromHtml = function (html, scope) {
        var doc = scope || document;
        var div = doc.createElement('div');
        div.innerHTML = html;
        if (!div.hasChildNodes() || div.childNodes.length > 1) {
            console.error('HTML does not have a single root node', html);
            throw new Error('HTML must have a single root node');
        }
        return fromDom(div.childNodes[0]);
    };
    var fromTag = function (tag, scope) {
        var doc = scope || document;
        var node = doc.createElement(tag);
        return fromDom(node);
    };
    var fromText = function (text, scope) {
        var doc = scope || document;
        var node = doc.createTextNode(text);
        return fromDom(node);
    };
    var fromDom = function (node) {
        if (node === null || node === undefined) {
            throw new Error('Node cannot be null or undefined');
        }
        return { dom: node };
    };
    var fromPoint = function (docElm, x, y) {
        return Optional.from(docElm.dom.elementFromPoint(x, y)).map(fromDom);
    };
    var SugarElement = {
        fromHtml: fromHtml,
        fromTag: fromTag,
        fromText: fromText,
        fromDom: fromDom,
        fromPoint: fromPoint
    };

    var bypassSelector = function (dom) {
        return dom.nodeType !== ELEMENT && dom.nodeType !== DOCUMENT && dom.nodeType !== DOCUMENT_FRAGMENT || dom.childElementCount === 0;
    };
    var all = function (selector, scope) {
        var base = scope === undefined ? document : scope.dom;
        return bypassSelector(base) ? [] : map(base.querySelectorAll(selector), SugarElement.fromDom);
    };

    var typeOf = function (x) {
        var t = typeof x;
        if (x === null) {
            return 'null';
        } else if (t === 'object' && (Array.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'Array')) {
            return 'array';
        } else if (t === 'object' && (String.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'String')) {
            return 'string';
        } else {
            return t;
        }
    };
    var isType$1 = function (type) {
        return function (value) {
            return typeOf(value) === type;
        };
    };
    var isArray = isType$1('array');

    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var isText = function (node) {
        return node.nodeType === 3;
    };

    var hasOwnProperty = Object.hasOwnProperty;
    var has = function (obj, key) {
        return hasOwnProperty.call(obj, key);
    };

    var parent = function (element) {
        return Optional.from(element.dom.parentNode).map(SugarElement.fromDom);
    };
    var children = function (element) {
        return map(element.dom.childNodes, SugarElement.fromDom);
    };

    var sort = function (xs, comparator) {
        var copy = nativeSlice.call(xs, 0);
        copy.sort(comparator);
        return copy;
    };

    var Cell = function (initial) {
        var value = initial;
        var get = function () {
            return value;
        };
        var set = function (v) {
            value = v;
        };
        return {
            get: get,
            set: set
        };
    };
    var map = function (xs, f) {
        var len = xs.length;
        var r = new Array(len);
        for (var i = 0; i < len; i++) {
            var x = xs[i];
            r[i] = f(x, i);
        }
        return r;
    };

    var escapeSearchText = function (text, wholeWord) {
        var escapedText = text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\s/g, '[^\\S\\r\\n\\uFEFF]');
        var wordRegex = '(' + escapedText + ')';
        return wholeWord ? '(?:^|\\s|' + punctuation() + ')' + wordRegex + ('(?=$|\\s|' + punctuation() + ')') : wordRegex;
    };
    var children = function (element) {
        return map(element.dom.childNodes, SugarElement.fromDom);
    };
    var spot = function (element, offset) {
        return {
            element: element,
            offset: offset
        };
    };
    var leaf = function (element, offset) {
        var cs = children(element);
        return cs.length > 0 && offset < cs.length ? spot(cs[offset], 0) : spot(element, offset);
    };
    var toLeaf = function (node, offset) {
        return leaf(SugarElement.fromDom(node), offset);
    };
    var walk = function (dom, walkerFn, startNode, callbacks, endNode, skipStart) {
        if (skipStart === void 0) {
            skipStart = true;
        }
        var next = skipStart ? walkerFn(false) : startNode;
        while (next) {
            var isCefNode = isContentEditableFalse(dom, next);
            if (isCefNode || isHidden(dom, next)) {
                var stopWalking = isCefNode ? callbacks.cef(next) : callbacks.boundary(next);
                if (stopWalking) {
                    break;
                } else {
                    next = walkerFn(true);
                    continue;
                }
            } else if (isSimpleBoundary(dom, next)) {
                if (callbacks.boundary(next)) {
                    break;
                }
            } else if (isText(next)) {
                callbacks.text(next);
            }
            if (next === endNode) {
                break;
            } else {
                next = walkerFn(false);
            }
        }
    };
    var nuSection = function () {
        return {
            sOffset: 0,
            fOffset: 0,
            elements: []
        };
    };
    var isHidden = function (dom, node) {
        return !dom.isBlock(node) && has(dom.schema.getWhiteSpaceElements(), node.nodeName);
    };
    var isContentEditableTrueInCef = function (dom, node) {
        return dom.getContentEditable(node) === 'true' && dom.getContentEditableParent(node.parentNode) === 'false';
    };
    var isContentEditableFalse = function (dom, node) {
        return dom.getContentEditable(node) === 'false';
    };
    var isSimpleBoundary = function (dom, node) {
        return dom.isBlock(node) || has(dom.schema.getShortEndedElements(), node.nodeName);
    };
    var isBoundary = function (dom, node) {
        return isSimpleBoundary(dom, node) || isContentEditableFalse(dom, node) || isHidden(dom, node) || isContentEditableTrueInCef(dom, node);
    };

    var collectTextToBoundary = function (dom, section, node, rootNode, forwards) {
        if (isBoundary(dom, node)) {
         return;
        }
        var rootBlock = dom.getParent(rootNode, dom.isBlock);
        var walker = new global$1(node, rootBlock);
        var walkerFn = forwards ? walker.next.bind(walker) : walker.prev.bind(walker);
        walk(dom, walkerFn, node, {
            boundary: always,
            cef: always,
            text: function (next) {
                if (forwards) {
                    section.fOffset += next.length;
                } else {
                    section.sOffset += next.length;
                }
                section.elements.push(SugarElement.fromDom(next));
            }
        });
    };
    var collect = function (dom, rootNode, startNode, endNode, callbacks, skipStart) {
        if (skipStart === void 0) {
            skipStart = true;
        }
        var walker = new global$1(startNode, rootNode);
        var sections = [];
        var current = nuSection();
        collectTextToBoundary(dom, current, startNode, rootNode, false);
        var finishSection = function () {
            if (current.elements.length > 0) {
                sections.push(current);
                current = nuSection();
            }
            return false;
        };
        walk(dom, walker.next.bind(walker), startNode, {
            boundary: finishSection,
            cef: function (node) {
                finishSection();
                if (callbacks) {
                    sections.push.apply(sections, callbacks.cef(node));
                }
                return false;
            },
            text: function (next) {
                current.elements.push(SugarElement.fromDom(next));
                if (callbacks) {
                    callbacks.text(next, current);
                }
            }
        }, endNode, skipStart);
        if (endNode) {
            collectTextToBoundary(dom, current, endNode, rootNode, true);
        }
        finishSection();
        // 重新过滤掉非章节的页面中的元素
        var sectionsCollect = [];
        sections.forEach(sect => {
            let dom = sect.elements[0]['dom'];
            let block = editor.dom.getParent(dom, '.info-block');
            if (block && block.dataset && block.dataset.outlinetype && ['3','4','5','6','8','9'].includes(block.dataset.outlinetype) && !editor.dom.hasClass(block, 'fixed')) {
                sectionsCollect.push(sect);
            }
        });
        return sectionsCollect;
        // return sections;
    };
    var descendants = function (scope, selector) {
        return all(selector, scope);
    };

    var collectRangeSections = function (dom, rng) {
        var start = toLeaf(rng.startContainer, rng.startOffset);
        var startNode = start.element.dom;
        var end = toLeaf(rng.endContainer, rng.endOffset);
        var endNode = end.element.dom;
        return collect(dom, rng.commonAncestorContainer, startNode, endNode, {
            text: function (node, section) {
                if (node === endNode) {
                    section.fOffset += node.length - end.offset;
                } else if (node === startNode) {
                    section.sOffset += start.offset;
                }
            },
            cef: function (node) {
                var sections = bind(descendants(SugarElement.fromDom(node), '*[contenteditable=true]'), function (e) {
                    var ceTrueNode = e.dom;
                    return collect(dom, ceTrueNode, ceTrueNode);
                });
                return sort(sections, function (a, b) {
                    return documentPositionPreceding(a.elements[0].dom, b.elements[0].dom) ? 1 : -1;
                });
            }
        }, false);
    };
    var fromRng = function (dom, rng) {
        return rng.collapsed ? [] : collectRangeSections(dom, rng);
    };
    var fromNode = function (dom, node) {
        var rng = dom.createRng();
        rng.selectNode(node);
        return fromRng(dom, rng);
    };
    var fromNodes = function (dom, nodes) {
        return bind(nodes, function (node) {
            return fromNode(dom, node);
        });
    };

    var nativeSlice = Array.prototype.slice;
    var nativePush = Array.prototype.push;
    var flatten = function (xs) {
        var r = [];
        for (var i = 0, len = xs.length; i < len; ++i) {
            if (!isArray(xs[i])) {
                throw new Error('Arr.flatten item ' + i + ' was not an array, input: ' + xs);
            }
            nativePush.apply(r, xs[i]);
        }
        return r;
    };

    var bind = function (xs, f) {
        return flatten(map(xs, f));
    };
    var some = function (a) {
        var constant_a = constant(a);
        var self = function () {
            return me;
        };
        var bind = function (f) {
            return f(a);
        };
        var me = {
            fold: function (n, s) {
              return s(a);
            },
            isSome: always,
            isNone: never,
            getOr: constant_a,
            getOrThunk: constant_a,
            getOrDie: constant_a,
            getOrNull: constant_a,
            getOrUndefined: constant_a,
            or: self,
            orThunk: self,
            map: function (f) {
                return some(f(a));
            },
            each: function (f) {
                f(a);
            },
            bind: bind,
            exists: bind,
            forall: bind,
            filter: function (f) {
                return f(a) ? me : NONE;
            },
            toArray: function () {
                return [a];
            },
            toString: function () {
                return 'some(' + a + ')';
            }
        };
        return me;
    };
    var from = function (value) {
        return value === null || value === undefined ? NONE : some(value);
    };
    var NONE = function () {
        var call = function (thunk) {
            return thunk();
        };
        var id = identity;
        var me = {
            fold: function (n, _s) {
              return n();
            },
            isSome: never,
            isNone: always,
            getOr: id,
            getOrThunk: call,
            getOrDie: function (msg) {
                throw new Error(msg || 'error: getOrDie called on none.');
            },
            getOrNull: constant(null),
            getOrUndefined: constant(undefined),
            or: id,
            orThunk: call,
            map: none,
            each: noop,
            bind: none,
            exists: never,
            forall: always,
            filter: function () {
                return none();
            },
            toArray: function () {
                return [];
            },
            toString: constant('none()')
        };
        return me;
    }();
    var none = function () {
        return NONE;
    };
    var Optional = {
        some: some,
        none: none,
        from: from
    };

    var NodeValue = function (is, name) {
        var get = function (element) {
            if (!is(element)) {
                throw new Error('Can only get ' + name + ' value of a ' + name + ' node');
            }
            return getOption(element).getOr('');
        };
        var getOption = function (element) {
            return is(element) ? Optional.from(element.dom.nodeValue) : Optional.none();
        };
        var set = function (element, value) {
            if (!is(element)) {
                throw new Error('Can only set raw ' + name + ' value of a ' + name + ' node');
            }
            element.dom.nodeValue = value;
        };
        return {
            get: get,
            getOption: getOption,
            set: set
        };
    };
    var api = NodeValue(isText$1, 'text');
    var get$1 = function (element) {
        return api.get(element);
    };

    var find$1 = function (pattern, sections) {
        return bind(sections, function (section) {
            var elements = section.elements;
            var content = map(elements, get$1).join('');
            var positions = find$2(content, pattern, section.sOffset, content.length - section.fOffset);
            return extract(elements, positions);
        });
    };

    var find$2 = function (text, pattern, start, finish) {
        if (start === void 0) {
            start = 0;
        }
        if (finish === void 0) {
            finish = text.length;
        }
        var regex = pattern.regex;
        regex.lastIndex = start;
        var results = [];
        var match;
        while (match = regex.exec(text)) {
            var matchedText = match[pattern.matchIndex];
            var matchStart = match.index + match[0].indexOf(matchedText);
            var matchFinish = matchStart + matchedText.length;
            if (matchFinish > finish) {
                break;
            }
            results.push({
                start: matchStart,
                finish: matchFinish
            });
            regex.lastIndex = matchFinish;
        }
        return results;
    };
    var foldl = function (xs, f, acc) {
        each(xs, function (x, i) {
            acc = f(acc, x, i);
        });
        return acc;
    };
    var groupBy = function (xs, f) {
        if (xs.length === 0) {
            return [];
        } else {
            var wasType = f(xs[0]);
            var r = [];
            var group = [];
            for (var i = 0, len = xs.length; i < len; i++) {
                var x = xs[i];
                var type = f(x);
                if (type !== wasType) {
                    r.push(group);
                    group = [];
                }
                wasType = type;
                group.push(x);
            }
            if (group.length !== 0) {
                r.push(group);
            }
            return r;
        }
    };
    var extract = function (elements, matches) {
        var nodePositions = foldl(elements, function (acc, element) {
            var content = get$1(element);
            var start = acc.last;
            var finish = start + content.length;
            var positions = bind(matches, function (match, matchIdx) {
                if (match.start < finish && match.finish > start) {
                    return [{
                        element: element,
                        start: Math.max(start, match.start) - start,
                        finish: Math.min(finish, match.finish) - start,
                        matchId: matchIdx
                    }];
                } else {
                    return [];
                }
            });
            return {
                results: acc.results.concat(positions),
                last: finish
            };
        }, {
            results: [],
            last: 0
        }).results;
        return groupBy(nodePositions, function (position) {
            return position.matchId;
        });
    };

    var before = function (marker, element) {
        var parent$1 = parent(marker);
        parent$1.each(function (v) {
            v.dom.insertBefore(element.dom, marker.dom);
        });
    };
    var append = function (parent, element) {
        parent.dom.appendChild(element.dom);
    };

    var wrap = function (element, wrapper) {
        before(element, wrapper);
        append(wrapper, element);
    };
    var rawSet = function (dom, key, value) {
        if (isString(value) || isBoolean(value) || isNumber(value)) {
            dom.setAttribute(key, value + '');
        } else {
            console.error('Invalid call to Attribute.set. Key ', key, ':: Value ', value, ':: Element ', dom);
            throw new Error('Attribute value was not simple');
        }
    };
    var set = function (element, key, value) {
        rawSet(element.dom, key, value);
    };


    var mark = function (matches, replacementNode) {
        eachr(matches, function (match, idx) {
            //debugger
            eachr(match, function (pos) {
                var wrapper = SugarElement.fromDom(replacementNode.cloneNode(false));
                set(wrapper, 'data-mce-index', idx);
                var textNode = pos.element.dom;
                if (textNode.length === pos.finish && pos.start === 0) {
                    wrap(pos.element, wrapper);
                } else {
                    if (textNode.length !== pos.finish) {
                        textNode.splitText(pos.finish);
                    }
                    var matchNode = textNode.splitText(pos.start);
                    wrap(SugarElement.fromDom(matchNode), wrapper);
                }
            });
        });
    };

    var findAndMarkInSelection = function (dom, pattern, selection, replacementNode) {
        var bookmark = selection.getBookmark();
        var nodes = dom.select('td[data-mce-selected],th[data-mce-selected]');
        var textSections = nodes.length > 0 ? fromNodes(dom, nodes) : fromRng(dom, selection.getRng());
        var matches = find$1(pattern, textSections);
        mark(matches, replacementNode);
        selection.moveToBookmark(bookmark);
        return matches.length;
    };

    var findAndMark = function (dom, pattern, node, replacementNode) {
        //debugger
        var textSections = fromNode(dom, node);
        var matches = find$1(pattern, textSections);
        mark(matches, replacementNode);
        return matches.length;
    };

    var markAllMatches = function (currentSearchState, pattern, inSelection) {
        var marker = editor.dom.create('span', { 'data-mce-bogus': 1 });
        marker.className = 'mce-match-marker';
        var node = editor.getBody();
        done(currentSearchState, false);
        if (inSelection) {
            return findAndMarkInSelection(editor.dom, pattern, editor.selection, marker);
        } else {
            return findAndMark(editor.dom, pattern, node, marker);
        }
    };

    var find = function (currentSearchState, text, matchCase, wholeWord, inSelection) {
        var escapedText = escapeSearchText(text, wholeWord);

        var pattern = {
            regex: new RegExp(escapedText, matchCase ? 'g' : 'gi'),
            matchIndex: 1
        };
        var count = markAllMatches(currentSearchState, pattern, inSelection);
        if (count) {
            var newIndex = moveSelection(currentSearchState, true);
            currentSearchState.set({
                index: newIndex,
                count: count,
                text: text
            });
        }
        return count;
    };

    var currentSearchState = Cell({
        index: -1,
        count: 0,
        text: ''
    });

    var reset = function (api) {
        done(currentSearchState, false);
        disableAll(api, true);
        updateButtonStates(api);
    };

    var disableAll = function (api, disable) {
        var buttons = [
            'setOne',
            'setAll',
            'prev',
            'next'
        ];
        var toggle = disable ? api.disable : api.enable;
        each(buttons, toggle);
    };

    var each = function (xs, f) {
        for (var i = 0, len = xs.length; i < len; i++) {
            var x = xs[i];
            f(x, i);
        }
    };
    var eachr = function (xs, f) {
        for (var i = xs.length - 1; i >= 0; i--) {
            var x = xs[i];
            f(x, i);
        }
    };

    var hasNext = function (currentSearchState) {
        return currentSearchState.get().count > 1;
    };
    var hasPrev = function ( currentSearchState) {
        return currentSearchState.get().count > 1;
    };

    var updateButtonStates = function (api) {
        var updateNext = hasNext(currentSearchState) ? api.enable : api.disable;
        updateNext('next');
        var updatePrev = hasPrev(currentSearchState) ? api.enable : api.disable;
        updatePrev('prev');
    };

    var getElmIndex = function (elm) {
        var value = elm.getAttribute('data-mce-index');
        if (typeof value === 'number') {
            return '' + value;
        }
        return value;
    };

    var unwrap = function (node, flag=false) {
        if (node) {
            var parentNode = node.parentNode;
            if(flag || editor.dom.hasClass(node, 'match-index')) {
                editor.dom.removeAllAttribs(node);
                node.setAttribute('class', 'match-index');
                node.dataset.marker = 'index';
                /*node.dataset.tag = JSON.stringify({
                    type:'index',
                    text: node.textContent
                });*/
                return node;

            } else {
                if (node.firstChild) {
                    parentNode.insertBefore(node.firstChild, node);
                }
                parentNode.removeChild(node);
            }
            return parentNode;
        }
        return null;
    };

    var clearIndexTag = function(node) {
        if (node) {
            var parentNode = node.parentNode;
            if (node.firstChild) {
                parentNode.insertBefore(node.firstChild, node);
            }
            parentNode.removeChild(node);
            return parentNode;
        }
        return null;
    };

    var getSpanNodes = function() {
        var nodes = []; //global$2.toArray(editor.getBody().getElementsByTagName('span'));
        var blocks = global$2.toArray(editor.getBody().querySelectorAll('.info-block'));
        blocks.forEach(block => {
            if (block.dataset && block.dataset.outlinetype && !['1','2','11','12'].includes(block.dataset.outlinetype)) {
                nodes = nodes.concat(global$2.toArray(block.getElementsByTagName('span')))
            }
        });
        return nodes;
    };

    var done = function (currentSearchState, keepEditorSelection) {
        var startContainer, endContainer;
        var searchState = currentSearchState.get();
        var nodes = getSpanNodes();
        for (var i = 0; i < nodes.length; i++) {
            var nodeIndex = getElmIndex(nodes[i]);
            if (nodeIndex !== null && nodeIndex.length) {
                if (nodeIndex === searchState.index.toString()) {
                    if (!startContainer) {
                        startContainer = nodes[i].firstChild;
                    }
                    endContainer = nodes[i].firstChild;
                }
                unwrap(nodes[i]);
            }
        }
        currentSearchState.set(__assign(__assign({}, searchState), {
            index: -1,
            count: 0,
            text: ''
        }));
        if (startContainer && endContainer) {
            var rng = editor.dom.createRng();
            rng.setStart(startContainer, 0);
            rng.setEnd(endContainer, endContainer.data.length);
            if (keepEditorSelection !== false) {
                editor.selection.setRng(rng);
            }
            return rng;
        }
    };

    var findSpansByIndex = function (index) {
        var spans = [];
        // var nodes = global$2.toArray(editor.getBody().getElementsByTagName('span'));
        var nodes = getSpanNodes();
        if (nodes.length) {
            for (var i = 0; i < nodes.length; i++) {
                var nodeIndex = getElmIndex(nodes[i]);
                if (nodeIndex === null || !nodeIndex.length) {
                    continue;
                }
                if (nodeIndex === index.toString()) {
                    spans.push(nodes[i]);
                }
            }
        }
        return spans;
    };

    var moveSelection = function (currentSearchState, forward) {
        var searchState = currentSearchState.get();
        var testIndex = searchState.index;
        var dom = editor.dom;
        forward = forward !== false;
        if (forward) {
            if (testIndex + 1 === searchState.count) {
                testIndex = 0;
            } else {
                testIndex++;
            }
        } else {
            if (testIndex - 1 === -1) {
                testIndex = searchState.count - 1;
            } else {
                testIndex--;
            }
        }
        dom.removeClass(findSpansByIndex(searchState.index), 'mce-match-marker-selected');
        var spans = findSpansByIndex(testIndex);
        if (spans.length) {
            dom.addClass(spans, 'mce-match-marker-selected');
            editor.selection.scrollIntoView(spans[0]);
            return testIndex;
        }
        return -1;
    };

    var next = function (currentSearchState) {
        var index = moveSelection(currentSearchState, true);
        currentSearchState.set(__assign(__assign({}, currentSearchState.get()), { index: index }));
    };
    var prev = function (currentSearchState) {
        var index = moveSelection(currentSearchState, false);
        currentSearchState.set(__assign(__assign({}, currentSearchState.get()), { index: index }));
    };

    var notFoundAlert = function (api) {
        editor.windowManager.alert('Could not find the specified string.', function () {
            api.focus('findtext');
        });
    };

    var doFind = function (api) {
        var data = api.getData();
        var last = currentSearchState.get();
        if (!data.findtext.length) {
            reset(api);
            return;
        }
        if (last.text === data.findtext) {
            next(currentSearchState);
        } else {
            var count = find(currentSearchState, data.findtext);
            if (count <= 0) {
                notFoundAlert(api);
            }
            disableAll(api, count === 0);
        }
        updateButtonStates(api);
    };
    // var selectedText = '';
    var initialState = currentSearchState.get();


    var isMatchSpan = function (node) {
        var matchIndex = getElmIndex(node);
        return matchIndex !== null && matchIndex.length > 0;
    };
    var removeNode = function (dom, node) {
        var parent = node.parentNode;
        dom.remove(node);
        if (dom.isEmpty(parent)) {
            dom.remove(parent);
        }
    };

    var setIndexTag = function (currentSearchState, isRemove=false, forward=false, all=false) {
        var searchState = currentSearchState.get();
        var currentIndex = searchState.index;
        var currentMatchIndex, nextIndex = currentIndex;
        forward = forward !== false;
        var body = editor.getBody();
        // var nodes = global$2.grep(global$2.toArray(body.getElementsByTagName('span')), isMatchSpan);
        var nodes = global$2.grep(global$2.toArray(getSpanNodes()), isMatchSpan);
        // debugger
        var tagNodes = [];
        for (var i = 0; i < nodes.length; i++) {
            var nodeIndex = getElmIndex(nodes[i]);
            var matchIndex = currentMatchIndex = parseInt(nodeIndex, 10);
            if (all || matchIndex === searchState.index) {
                var parentNode = unwrap(nodes[i], !isRemove);
                tagNodes.push(parentNode);
                while (nodes[++i]) {
                    matchIndex = parseInt(getElmIndex(nodes[i]), 10);
                    if (matchIndex === currentMatchIndex) {
                        removeNode(editor.dom, nodes[i]);
                    } else {
                        i--;
                        break;
                    }
                }
                if (forward) {
                    nextIndex--;
                }
            } else if (currentMatchIndex > currentIndex) {
                nodes[i].setAttribute('data-mce-index', String(currentMatchIndex - 1));
            }
        }
        currentSearchState.set(__assign(__assign({}, searchState), {
            count: all ? 0 : searchState.count - 1,
            index: nextIndex
        }));
        if (forward) {
            next(currentSearchState);
        } else {
            prev(currentSearchState);
        }
        // 发送指令
        editor.execCommand('setIndexTag',  { nodes:Array.from(tagNodes), text:searchState.text, isRemove });

        return !all && currentSearchState.get().count > 0;
    };

    var singleton = function (doRevoke) {
        var subject = Cell(Optional.none());
        var revoke = function () {
            return subject.get().each(doRevoke);
        };
        var clear = function () {
            revoke();
            subject.set(Optional.none());
        };
        var isSet = function () {
            return subject.get().isSome();
        };
        var get = function () {
            return subject.get();
        };
        var set = function (s) {
            revoke();
            subject.set(Optional.some(s));
        };
        return {
            clear: clear,
            isSet: isSet,
            get: get,
            set: set
        };
    };

    var value = function () {
        var subject = singleton(noop);
        var on = function (f) {
            return subject.get().each(f);
        };
        return __assign(__assign({}, subject), { on: on });
    };
	
	var global = tinymce.util.Tools.resolve('tinymce.Env');
	
	var focusButtonIfRequired = function (api, name) {
        if (global.browser.isSafari() && global.deviceType.isTouch() && (name === 'find' || name === 'replace' || name === 'replaceall')) {
			api.focus(name);
        }
	};

    var doAct = function(isRemove=0) {
        var currNode = editor.selection.getNode();
        if (isRemove) {
            if (editor.dom.hasClass(currNode, 'match-index')) {
                clearIndexTag(currNode);
                editor.execCommand('setIndexTag');
            } else {
                editor.windowManager.alert('当前元素未定义索引项！')
            }
            return;
        }
        // 只能在章节进行标记索引项
        
        var block = editor.dom.getParent(currNode, '.info-block');
        if (block && block.dataset && block.dataset.outlinetype && ['1','2','11','12'].includes(block.dataset.outlinetype)) {
            editor.windowManager.alert('只能在章节中进行标记索引项！');
            return false;
        }

        selectedText = global$2.trim(editor.selection.getContent({ format: 'text' }));
        var initialData = {
            findtext: selectedText
        };
        var dialogApi = value();
        editor.undoManager.add();
        var spec = {
            title: !isRemove ? '标记索引项' : '删除索引项',
            size: 'normal',
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'bar',
                        items: [
                            {
                                type: 'input',
                                name: 'findtext',
                                placeholder: '查找索引项内容',
                                maximized: true,
                                inputMode: 'search'
                            },
                            {
                                type: 'button',
                                name: 'prev',
                                text: 'Previous',
                                icon: 'action-prev',
                                disabled: true,
                                borderless: true
                            },
                            {
                                type: 'button',
                                name: 'next',
                                text: 'Next',
                                icon: 'action-next',
                                disabled: true,
                                borderless: true
                            }
                        ]
                    }
                ]
            },
            initialData: initialData,
            buttons: [
                {
                    type: 'custom',
                    name: 'find',
                    text: 'Find',
                    primary: true
                },
                {
                    type: 'custom',
                    name: 'setOne',
                    text: !isRemove ? '标记' : '删除',
                    disabled: true
                },
                {
                    type: 'custom',
                    name: 'setAll',
                    text: !isRemove ? '标记全部' : '删除全部',
                    disabled: true
                },
                {
                    type: 'custom',
                    name: 'cancel',
                    text: '关闭'
                }
            ],
            initialData: initialData,
            onChange: function(api, details) {
                if (details.name === 'findtext' && currentSearchState.get().count > 0) {
                    reset(api);
                }
            },
            onAction: function(api, details) {
                var data = api.getData();
                // console.log(details.name)
                switch (details.name) {
                    case 'find':
                        doFind(api);
                        break;
                    case 'prev':
                        prev(currentSearchState);
                        updateButtonStates(api);
                        break;
                    case 'next':
                        next(currentSearchState);
                        updateButtonStates(api);
                        break;
                    case 'setOne':
                        if (!setIndexTag(currentSearchState, isRemove)) {
                            reset(api);
                        } else {
                            updateButtonStates(api);
                        }
                        break;
                    case 'setAll':
                        setIndexTag(currentSearchState, isRemove, true, true);
                        reset(api);
                        break;
                    case 'cancel':
                        api.close();
                        break;
                    focusButtonIfRequired(api, details.name);
                }
            },
            onSubmit: function (api) {
                doFind(api);
                focusButtonIfRequired(api, 'find');
            },
            onClose: function () {
                editor.focus();
                done(currentSearchState);
                editor.undoManager.add();
            }
        };
        dialogApi.set(editor.windowManager.open(spec, { inline: 'toolbar' }));
    };

    var itemTypes = [
        {
            type: 'menuitem',
            text: 'set index marker',
            onAction: () => {
                doAct(0);
            }
        },
        {
            type: 'menuitem',
            text: 'remove index marker',
            onAction: () => {
                doAct(1);
            }

        }
    ];

    editor.ui.registry.addMenuButton('indexMarker', {
        text: 'index marker',
        fetch: callback => {
            callback(itemTypes);
        }
    });

    editor.ui.registry.addNestedMenuItem('indexMarker', {
        text: 'index marker',
        getSubmenuItems: function () {
            return itemTypes;
        }
    });

    /* editor.addCommand('openWordFile', (type) => {
        doAct(type);
    }) */

    return {
        getMetadata: function() {
            return {
                name: pluginName,
                url: "http://www.bzton.cn",
            };
        }
    };
})
