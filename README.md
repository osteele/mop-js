# JavaScript MOP Utilities

This library defines utilities for JavaScript metaprogramming.
See the specs for examples.

## Status

This library predates, and has not been updated for, ECMAScript 5's getters, setters, and `Object.defineProperty` method.

## Method Definition Methods

    MOP.Object(object).accessor(propertyName)
    MOP.Class(klass).accessor(propertyName)

Attaches `getXXX` and `setXXX` to `object` or to
`klass.prototype`.  `XXX` is the capitalized form of
`propertyName`; for example, `name` generates `getName` and `setName`.

    MOP.Object(object).getter(propertyName)
    MOP.Class(klass).getter(propertyName)

Attaches `getXXX` to `object` or to `klass.prototype`.
`XXX` is the capitalized form of `propertyName`; for example, `name`
generates `getName`.

    MOP.Object(object).delegate(propertyName, methods)
    MOP.Class(klass).delegate(propertyName, methods)

For each name in `methods`, defines a method on `object` or
`klass.prototype` with this name, that delegates to the
method of the `propertyName` property of `object` with the same name.


## Method Wrapper Methods

    MOP.Object(object).method(methodName).guardBy(guardFn)
    MOP.Class(klass).method(methodName).guardBy(guardFn)

Replaces `object.methodName` by a method that calls the
underlying method only if `guardFn`, applied to the same arguments,
returns a true value.

    MOP.Object(object).method(methodName).guardUntil(guardFn, ms)
    MOP.Class(klass).method(methodName).guardUntil(guardFn, ms)

A call to `object.methodName` causes a timer to
periodically call `guardFn` until it returns a true value, at which
point the underlying function is called, and the timer stops.

    MOP.Object(object).method(methodName).time(guardFn)
    MOP.Class(klass).method(methodName).time(guardFn)

Replaces `object.methodName` by a method that calls the
underlying function, and prints to the console the name of the method
and the time it took to execute.

    MOP.Object(object).method(methodName).trace(guardFn)
    MOP.Class(klass).method(methodName).trace(guardFn)

Replaces `object.methodName` by a method that calls the
underlying function, and prints to the console the name of the method
and its return value.


## Temporary Method Replacement

    new MOP.MethodReplacer(object, methods)

When a new MethodReplacer is constructed, it replaces each method
on `object` by the method in `methods` with the same key value, if
such a method exists.  A MethodReplacer has a single method,
`restore`, which restores each method to its pre-replacement
value.

    MOP.withMethodOverridesCallback(object, methods, k)

Calls `fn` on `object`, within a dynamic scope within which the
methods in `methods` have temporarily replaced the like-named
methods on `object`.  The scope is terminated by the argument to
the call to `k`; this argument should be treated as a
continuation, and restores the methods.


## Method Call Serialization

    new MOP.QueueBall(object, methodNames)

When a new QueueBall is constructed, it replaces each method named
by `methodNames` with a method that enqueues the method call (the
name of the method and its arguments).  A QueueBall has a single
method, `replayMethodCalls`, which plays back the method calls and
restores the methods.

    MOP.withDeferredMethods(object, methodNames, k)

Calls `fn` on `object`, within a dynamic scope within which the
methods in `methodNames` have been enqueued.  The scope is
terminated by the argument to the call to `k`; this argument
should be treated as a continuation, and ends the queue, replaying
the methods.


## Repository

Download from http://github.com/osteele/mop-js, or clone from

    git clone http://github.com/osteele/mop-js.git


## License

Copyright 2007-2008 by Oliver Steele.  All rights reserved.
Available under the MIT License.
