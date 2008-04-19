describe('MOP.delegate', {
    'should delegate to the named field': function() {
        var captures = [];
        var delegatee = {f: function(x) {captures.push(x); return 2}};
        var object = {d: delegatee};
        MOP.Object(object).delegate('d', ['f']);
        value_of(object.f(1)).should_be(2);
        value_of(captures.join(',')).should_be('1');
    },
    'should leave other methods alone': function() {
        var captures = [];
        var delegatee = {f: function(x) {captures.push(x); return 2}};
        var object = {d: delegatee, g: function(x) {return 3}};
        MOP.Object(object).delegate('d', ['f']);
        value_of(object.g(1)).should_be(3);
        value_of(captures.join(',')).should_be('');
    },
    'should work on classes': function() {
        var captures = [];
        var delegatee = {f: function(x) {captures.push(x); return 2}};
        function Delegator(delegatee) {
            this.d = delegatee;
        }
        MOP.Class(Delegator).delegate('d', ['f']);
        var object = new Delegator(delegatee);
        value_of(object.f(1)).should_be(2);
        value_of(captures.join(',')).should_be('1');
    }
});

describe('MOP.define', {
    'should define accessors': function() {
        var object = {};
        MOP.Object(object).define.accessor('name');
        object.setName(1);
        value_of(object.name).should_be(1);
        value_of(object.getName()).should_be(1);
    },
    'should define getters': function() {
        var object = {name:1};
        MOP.Object(object).define.getter('name');
        value_of(object.setName).should_be(undefined);
        value_of(object.getName()).should_be(1);
    },
    'should apply to classes': function() {
        function Klass() {};
        MOP.Class(Klass).define.accessor('name');
        var object = new Klass;
        object.setName(1);
        value_of(object.name).should_be(1);
        value_of(object.getName()).should_be(1);
    },
});

describe('MOP.method', {
    'should define guardBy': function() {
        var object = {f: function() { return 1 }};
        var guarded = true;
        MOP.Object(object).method('f').guardBy(function() { return !guarded });
        value_of(object.f()).should_be(false);
        guarded = false;
        value_of(object.f()).should_be(1);
    }
});

describe('MOP.MethodReplacer', {
    'should replace specified methods': function() {
        var object = {f: function(x) {return 1}};
        var replacer = new MOP.MethodReplacer(
            object,
            {f: function(x) {return 2}});
        value_of(object.f()).should_be(2);
        replacer.restore();
        value_of(object.f()).should_be(1);
    }
});

describe('MOP.QueueBall', {
    'should enqueue specified methods': function() {
        var captures = [];
        var object = {
            f: function(x) {captures.push('f-'+x)},
            g: function(x) {captures.push('g-'+x)},
            h: function(x) {captures.push('h-'+x)}
        };
        var queueBall = new MOP.QueueBall(
            object, ['f', 'g']);
        object.f(1);
        object.h(10);
        object.f(2);
        object.g(3);
        object.f(4);
        object.h(20);
        value_of(captures.join(',')).should_be('h-10,h-20');
        
        captures = [];
        queueBall.replayMethodCalls();
        value_of(captures.join(',')).should_be('f-1,f-2,g-3,f-4');
        
        captures = [];
        object.f(1);
        object.h(10);
        object.f(2);
        object.g(3);
        object.f(4);
        object.h(20);
        value_of(captures.join(',')).should_be('f-1,h-10,f-2,g-3,f-4,h-20');
    }
});

describe('MOP.withMethodOverridesCallback', {
    'should temporarily override specified methods': function() {
        var captures = [];
        var object = {f: function(x) {return 1}};
        MOP.withMethodOverridesCallback(
            object,
            {f: function(x) {return 2}},
            function(k) {captures.push(object.f()); k()});
        value_of(captures.join(',')).should_be('2');
        value_of(object.f()).should_be(1);
    }
});

describe('MOP.withDeferredMethods', {
    'should defer named methods': function() {
        var captures = [];
        var object = {
            f: function(x) {captures.push('f-' + x); return x+1},
            g: function(x) {captures.push('g-' + x); return x+2},
        };
        MOP.withDeferredMethods(
            object,
            ['f', 'g'],
            function(k) {
                object.f(1);
                object.f(2);
                object.g(3);
                object.f(4);
                value_of(captures.length).should_be(0);
                k();
            }
        );
        value_of(captures.join(',')).should_be('f-1,f-2,g-3,f-4');
        value_of(object.f(5)).should_be(6);
        value_of(captures.join(',')).should_be('f-1,f-2,g-3,f-4,f-5');
    },
    'should leave unnamed methods alone': function() {
        var object = {
            f: function(x) {return x+1},
            g: function(x) {return x+2},
            h: function(x) {return x+3}
        };
        MOP.withDeferredMethods(
            object,
            ['f', 'g'],
            function(k) {
                value_of(object.h(1)).should_be(4);
                k();
            });
    }
});
