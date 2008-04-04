/* Copyright 2007-2008 by Oliver Steele.  Available under the MIT License. */

MOP = {
    /** For each name in `methods`, defines a method on `target` with this
      * name, that delegates to the method of the `propertyName` property of
      * `target` with the same name. */
    delegate: function(target, propertyName, methods) {
        for (var i = 0; i < methods.length; i++)
            addMethod(methods[i]);
        function addMethod(name) {
            target[name] = function() {
                var delegate = this[propertyName];
                return delegate[name].apply(delegate, arguments);
            }
        }
    },
    
    /** Calls `fn` on `object`, within a dynamic scope within
      * which the methods in `methods` have temporarily replaced
      * the like-named methods on `object`.
      * The scope is terminated by the argument to the call to
      * `fn`; this argument should be treated as a continuation,
      * and restores the methods. */
    withMethodOverridesCallback: function(object, methods, fn) {
        if (!methods) return fn.call(object, function() {});
        var replacer = new MOP.MethodReplacer(object, methods);
        return fn.call(object, replacer.restore);
    },
    
    /** Calls `fn` on `object`, within a dynamic scope within
      * which the methods in `methodNames` have been enqueued.
      * The scope is terminated by the argument to the call to
      * `fn`; this argument should be treated as a continuation,
      * and ends the queue, replaying the methods. */
    withDeferredMethods: function(object, methodNames, fn) {
        var qball = new MOP.QueueBall(object, methodNames);
        return fn.call(object, qball.replayMethodCalls);
    },
    
    /** When a new MethodReplacer is constructed, it replaces
      * each method on `object` by the method in `methods`
      * with the same key value, if such a method exists.
      * A MethodReplacer has a single method, `restoreMethods`,
      * which restores each method to its pre-replacement
      * value. */
    MethodReplacer: function(object, methods) {
        var savedMethods = {};
        replaceMethods();
        this.restore = restoreMethods;
        
        function replaceMethods() {
            for (var name in methods) {
                savedMethods[name] = object[name];
                object[name] = methods[name];
            }
        }
        function restoreMethods() {
            for (var name in methods) {
                delete object[name];
                object[name] == savedMethods[name] ||
                    (object[name] = savedMethods[name]);
            }
        }
    },
    
    /** When a new QueueBall is constructed, it replaces each
      * method named by `methodNames` with a method that enqueues
      * the method call (the name of the method and its arguments).
      * A QueueBall has a single method, `replayMethodCalls`, which
      * plays back the method calls and restores the methods.
      */
    QueueBall: function(object, methodNames) {
        var savedMethods = {},
            queue = [];
        replaceMethods();
        this.replayMethodCalls = replayMethodCalls;
        
        function replaceMethods() {
            for (var ix in methodNames) {
                var name = methodNames[ix];
                savedMethods[name] = object[name];
                object[name] = makeInterceptor(name);
            }
        }
        function restoreMethods() {
            for (var ix in methodNames) {
                var name = methodNames[ix];
                delete object[name];
                object[name] == savedMethods[name] ||
                    (object[name] = savedMethods[name]);
            }
        }
        function makeInterceptor(name) {
            return function() {
                var item = [name].concat(Array.prototype.slice.call(arguments, 0));
                queue.push(item);
            }
        }
        function replayMethodCalls() {
            restoreMethods();
            while (queue.length) {
                var item = queue.shift(),
                    name = item.shift();
                object[name].apply(object, item);
            }
        }
    }
}
