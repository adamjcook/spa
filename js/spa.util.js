/*
* spa.util.js
* General JavaScript utilities
*/

/* jslint        browser: true, continue: true,
   devel: true,  indent: 2,     maxerr: 50,
   newcap: true, nomen: true,   plusplus: true,
   regexp: true, sloppy: true,  vars: false,
   white: true
*/

/* global $, spa */

spa.util = (function() {
	
	var makeError, setConfigMap;
	
	// Begin Public constructor /makeError/
	// Purpose: A convenience wrapper to create an error object
	// Arguments:
	//    * name_text - the error name
	//    * msg_text - long error message
	//    * data - optional data attached to error object
	// Returns: Newly constructed error object.
	// Throws: none
	//
	makeError = function(name_text, msg_text, data) {
		var error = new Error();
		error.name = name_text;
		error.message = msg_text;
		
		if (data) {
			error.data = data;
		}
		
		return error;
	};
	// End Public constructor /makeError/
	
	// Begin Public method /setConfigMap/
	// Purpose: Common code to set configs in feature modules.
	// Arguments:
	//    * input_map - map of key-values to set in config
	//    * settable_map - map of allowable keys to set
	//    * config_map - map to apply settings to
	// Returns: true
	// Throws: Exception if input key is not allowed.
	setConfigMap = function(arg_map) {
		console.log('In setConfigMap, arg_map is: ');
		console.log(arg_map);
		var input_map = arg_map.input_map;
		var settable_map = arg_map.settable_map;
		var config_map = arg_map.config_map;
		var key_name;
		var error;
		
		for (key_name in input_map) {
			console.log('In setConfigMap, key_name is: ');
			console.log(key_name);
			if (input_map.hasOwnProperty(key_name)) {
				config_map[key_name] = input_map[key_name];
			} else {
				error = makeError('Bad Input', 
					'Setting config key |' + key_name + '| is not supported');
				throw error;
			}
		}
		console.log('After spa.util.setConfigMap runs, config_map is: ');
		console.log(config_map);
	};
	//End Public method /setConfigMap/
	
	return {
		makeError: makeError,
		setConfigMap: setConfigMap
	};
	
}());