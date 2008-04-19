var Examples = {
    'guard until': function(done) {
        done(false);
        var obj = {f: function() {console.info('called'); done()}};
        var guarded = true;
        MOP.Object(obj).method('f').guardUntil(function() {return !guarded});
        console.info('should not print anything');
        obj.f();
        console.info('now should print "called"');
        guarded = false;
    },
    
    'trace method': function() {
        console.info('should print trace for f:');
        var obj = {f: function() {return 1}};
        MOP.Object(obj).method('f').trace();
        obj.f();
        console.info('should just print 1, without trace:');
        obj.f.remove();
        console.info(obj.f());
    },
    
    'time method': function() {
        console.info('should print timing for f:');
        var obj = {f: function() {return 1}};
        MOP.Object(obj).method('f').time();
        obj.f();
        console.info('should just print 1, without timing:');
        obj.f.remove();
        console.info(obj.f());
    }
}

function runExamples() {
    var names = [];
    for (var name in Examples)
        names.push(name);
    next();
    function next() {
        console.info(' ');
        if (!names.length) return;
        var name = names.shift(),
            fn = Examples[name],
            locked = false,
            running = true;
        console.info('Example: ' + name);
        fn(setDone);
        running = false;
        locked || next();
        function setDone(done) {
            if (done || arguments.length < 1) {
                locked = false;
                running || next();
            } else
                locked = true;
        }
    }
}

runExamples();
