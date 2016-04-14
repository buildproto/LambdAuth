'use strict';

function makeHandler() {

    var handler = function (event, context) {
    	var email = event.email;
    	var clearPassword = event.password;
    
        console.log('Event email:', util.inspect(event, false, null));
        console.log('Event context:', util.inspect(context, false, null));
    
    	computeHash(clearPassword, function(err, salt, hash) {
    		if (err) {
    			context.fail('Error in hash: ' + err);
    		} else {
    			storeUser(email, hash, salt, function(err, token) {
    				if (err) {
    					if (err.code == 'ConditionalCheckFailedException') {
    						// userId already found
    						context.succeed({
    							created: false
    						});
    					} else {
    						context.fail('Error in storeUser: ' + err);
    					}
    				} else {
    					sendVerificationEmail(email, token, function(err, data) {
    						if (err) {
    							context.fail('Error in sendVerificationEmail: ' + err);
    						} else {
    							context.succeed({
    								created: true
    							});
    						}
    					});
    				}
    			});
    		}
    	});
    }

    return function wrapHandler(event, context) {
        var EventEmitter = require('events').EventEmitter;
        var emitter = new EventEmitter();
        console.log('EventEmitter:', typeof EventEmitter, 'emitter:', typeof emitter);

        emitter.on('error', function(err) {
            context.fail(err);
        }); 

        console.log('emitter:', JSON.stringify(emitter), 'handler:', JSON.stringify(handler));
        handler = emitter.bind(handler);

        process.nextTick(function() {
            handler.apply(this, arguments);
        }); 
   }
}

module.exports = makeHandler;
