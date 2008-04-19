/* Copyright 2007-2008 by Oliver Steele.  Available under the MIT License. */

MOP = {
    Object: function(object) {
        var definers = {
            accessor: function(propertyName) {
                var capitalized = propertyName.slice(0, 1).toUpperCase() + propertyName.slice(1);
                object['get' + capitalized] = function() { return this[propertyName] };
                object['set' + capitalized] = function(value) { this[propertyName] = value; };
            },
            getter: function(propertyName) {
                var capitalized = propertyName.slice(0, 1).toUpperCase() + propertyName.slice(1);
                object['get' + capitalized] = function() { return this[propertyName] }
            }
        };
        function method(methodName) {
            var fn = object[methodName];
            return {
                guardBy: function(guard) {
                    return replaceBy(function() {
                        return guard() && fn.apply(this, arguments);
                    });
                },
                guardUntil: function(guard, ms) {
                    ms = ms || 1000;
                    return replaceBy(function() {
                        var self = this,
                            args = Array.prototype.slice.call(arguments, 0),
                            timer = setInterval(function() {
                                if (!guard()) return;
                                clearInterval(timer);
                                restore();
                                fn.apply(self, args);
                            }, ms);
                        return timer;
                    });
                },
                trace: function() {
                    return replaceBy(function() {
                        var result = fn.apply(this, arguments);
                        console.info(methodName, result);
                        return result;
                    });
                },
                time: function() {
                    return replaceBy(function() {
                        var t0 = new Date,
                            result = fn.apply(this, arguments),
                            t1 = new Date;
                        console.info(methodName, t1 - t0);
                        return result;
                    });
                }
            }
            function replaceBy(newFn) {
                object[methodName] = newFn;
                newFn.remove = restore;
                return method(methodName);
            }
            function restore() { object[methodName] = fn }
        }
        return { define: definers, method: method,
                 /** For each name in `methods`, defines a method on
                    `object` with this name, that delegates to the method of
                     the `propertyName` property of `object` with the same
                     name. */
                 delegate: function(propertyName, methods) {
                     for (var i = 0; i < methods.length; i++)
                         addMethod(methods[i]);
                     function addMethod(methodName) {
                         object[methodName] = function() {
                             var delegate = this[propertyName];
                             return delegate[methodName].apply(delegate, arguments);
                         }
                     }
                 }
               }
    },
    
    Class: function(klass) { return this.Object(klass.prototype) },
    
    
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
    }
}
