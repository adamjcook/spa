/*
* spa.chat.js
* Chat feature module for SPA
*/

/* jslint        browser: true, continue: true,
   devel: true,  indent: 2,     maxerr: 50,
   newcap: true, nomen: true,   plusplus: true,
   regexp: true, sloppy: true,  vars: false,
   white: true
*/

/* global $, spa */

spa.shell = (function() {
	
	// ----------BEGIN MODULE SCOPE VARIABLES----------
	
	var configMap = {
			anchor_schema_map: {
				chat: {opened: true, closed: true}
			},
			main_html:
				'<div class="spa-shell-head">'
				+ '<div class="spa-shell-head-logo"></div>'
				+ '<div class="spa-shell-head-acct"></div>'
				+ '<div class="spa-shell-head-search"></div>'
				+ '</div>'
				+ '<div class="spa-shell-main">'
				+ '<div class="spa-shell-main-nav"></div>'
				+ '<div class="spa-shell-main-content"></div>'
				+ '</div>'
				+ '<div class="spa-shell-foot"></div>'
				+ '<div class="spa-shell-modal"></div>',
			resize_interval: 200
	};
	var stateMap = {
			anchor_map: {},
			resize_idto: undefined
	};
	var jqueryMap = {};
	var copyAnchorMap;
	var setJqueryMap;
	var changeAnchorPart;
	var onHashchange;
	var onResize;
	var setChatAnchor;
	var initModule;
	
	// ----------END MODULE SCOPE VARIABLES----------
	
	// ----------BEGIN UTILITY METHODS----------
	
	// Returns copy of stored anchor map; minimizes overhead
	copyAnchorMap = function() {
		return $.extend(true, {}, stateMap.anchor_map);
	};
	
	// ----------END UTILITY METHODS----------
	
	// ----------BEGIN DOM METHODS----------
	
	// Begin DOM method /setJqueryMap/
	setJqueryMap = function() {
		var $container = stateMap.$container;
		
		jqueryMap = {
			$container: $container
		};
	};
	// End DOM method /setJqueryMap/
	
	// Begin DOM method /changeAnchorPart/
	// Purpose: Changes part of the URI anchor component
	// Arguments:
	//    * arg_map - The map describing what part of the URI anchor we need
	//      changed.
	// Returns: boolean
	//    * true - the Anchor portion of the URI was updated
	//    * false - the Anchor portion of the URI could not be updated
	// Action:
	//    The current anchor rep stored in stateMap.anchor_map.
	//    See uriAnchor for a discussion of encoding.
	//    This method
	//       * Creates a copy of this map using copyAnchorMap().
	//       * Modifies the key-value using arg_map.
	//       * Manages the distinction between independent and dependent
	//         values in the encoding.
	//       * Attempts to change the URI using uriAnchor.
	//       * Returns true on success, and false on failure.
	//
	changeAnchorPart = function(arg_map) {
		console.log('In changeAnchorPart function');
		console.log('arg_map passed to changeAnchorPart: ');
		console.log(arg_map);
		var anchor_map_revise = copyAnchorMap();
		var bool_return = true;
		var key_name;
		var key_name_dep;
		
		// Begin merge changes into anchor map
		KEYVAL:
		for (key_name in arg_map) {
			console.log('key_name: ');
			console.log(key_name);
			if (arg_map.hasOwnProperty(key_name)) {
				console.log('arg_map.hasOwnProperty(key_name) is true');
				// skip dependent keys during iteration
				if (key_name.indexOf('_') === 0) {
					console.log("key_name.indexOf('_') is 0");
					continue KEYVAL;
				}
				
				//update independent key value
				anchor_map_revise[key_name] = arg_map[key_name];
				
				// update matching dependent key
				key_name_dep = '_' + key_name;
				if (arg_map[key_name_dep]) {
					console.log('arg_map[key_name_dep] is true');
					anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
				} else {
					console.log('arg_map[key_name_dep] is false');
					console.log('anchor_map_revise[key_name_dep]: ');
					console.log(anchor_map_revise[key_name_dep]);
					console.log("anchor_map_revise['_s' + key_name_dep]: ");
					console.log(anchor_map_revise['_s' + key_name_dep]);
					delete anchor_map_revise[key_name_dep];
					delete anchor_map_revise['_s' + key_name_dep];
				}
			}
		}
		// End merge changes into anchor map
		
		// Begin attempt to update URI; revert if not successful
		try {
			console.log('Updating URI using anchor_map_revise: ');
			console.log(anchor_map_revise);
			$.uriAnchor.setAnchor(anchor_map_revise);
		} catch (error) {
			// replace URI with existing state
			$.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
			bool_return = false;
		}
		// End attempt to update URI
		
		return bool_return;
	};
	// End DOM method /changeAnchorPart/
		
	// ----------END DOM METHODS----------
	
	// ----------BEGIN EVENT HANDLERS----------
	
	// Begin Event handler /onHashchange/
	// Purpose: Handles the hashchange event
	// Arguments:
	//    * event - jQuery event object
	// Settings: none
	// Returns: boolean false
	// Action:
	//    * Parses the URI anchor component
	//    * Compares proposed application state with current
	//    * Adjust the application only where proposed state differs from
	//      existing
	//
	onHashchange = function(event) {
		var anchor_map_previous = copyAnchorMap();
		var archor_map_proposed;
		var _s_chat_previous;
		var _s_chat_proposed;
		var s_chat_proposed;
		var is_ok = true;
		console.log('Anchor map previous: ');
		console.log(anchor_map_previous);
		
		// Attempt to parse anchor
		try {
			anchor_map_proposed = $.uriAnchor.makeAnchorMap();
			console.log('Anchor map proposed: ');
			console.log(anchor_map_proposed)
		} catch (error) {
			$.uriAnchor.setAnchor(anchor_map_previous, null, true);
			return false;
		}
		stateMap.anchor_map = anchor_map_proposed;
		
		// Convenience variables
		_s_chat_previous = anchor_map_previous._s_chat;
		_s_chat_proposed = anchor_map_proposed._s_chat;
		console.log('_s_chat_previous: ');
		console.log(_s_chat_previous);
		console.log('_s_chat_proposed: ');
		console.log(_s_chat_proposed);
		
		// Begin adjust chat component if changed
		if (!anchor_map_previous || _s_chat_previous !== _s_chat_proposed) {
			s_chat_proposed = anchor_map_proposed.chat;
			console.log('s_chat_proposed: ');
			console.log(s_chat_proposed);
			switch (s_chat_proposed) {
			case 'opened':
				console.log('Opened case called');
				is_ok = spa.chat.setSliderPosition('opened');
				break;
			case 'closed':
				console.log('Closed case called');
				is_ok = spa.chat.setSliderPosition('closed');
				break;
			default:
				console.log('Default case called');
				spa.chat.setSliderPosition('closed');
				delete anchor_map_proposed.chat;
				$.uriAnchor.setAnchor(anchor_map_proposed, null, true);
			}
		}
		// End adjust chat component if changed
		
		// Begin revert anchor if slider change denied
		if (!is_ok) {
			if (anchor_map_previous) {
				$.uriAnchor.setAnchor(anchor_map_previous, null, true);
				stateMap.anchor_map = anchor_map_previous;
			} else {
				delete anchor_map_proposed.chat;
				$.uriAnchor.setAnchor(anchor_map_proposed, null, true);
			}
		}
		// End revert anchor if slider change denied
		
		return false;
	};
	// End Event handler /onHashchange/
	
	// Begin Event handler /onResize/
	onResize = function() {
		if (stateMap.resize_idto) {
			return true;
		}
		spa.chat.handleResize();
		
		console.log('onResize called!');
		
		stateMap.resize_idto = setTimeout(
			function() {
				stateMap.resize_itdo = undefined;
			}, configMap.resize_interval
		);
		
		return true;
	};
	// End Event handler /onResize/
	
	// ----------END EVENT HANDLERS----------
	
	// ----------BEGIN CALLBACKS----------
	
	// Begin callback method /setChatAnchor/
	//
	// Example: setChatAnchor('closed');
	// Purpose: Change the chat component of the anchor
	// Arguments:
	//    * position_type - may be 'closed' or 'opened'
	// Action:
	//    Changes the URI anchor parameter 'chat' to the requested value if
	//    possible.
	// Returns:
	//    * true - requested anchor part update
	//    * false - requested anchor part not updated
	// Throws: none
	//
	setChatAnchor = function(position_type) {
		console.log('position_type in setChatAnchor() function is: ');
		console.log(position_type);
		return changeAnchorPart({chat: position_type});
	};
	// End callback method /setChatAnchor/
	
	// ----------END CALLBACKS----------
	
	// ----------BEGIN PUBLIC METHODS----------
	
	// Begin Public method /initModule/
	initModule = function($container) {
		// Load HTML and map jQuery collections
		$container.html(configMap.main_html);
		stateMap.$container = $container;
		setJqueryMap();
		
		// Configure uriAnchor to use our schema
		$.uriAnchor.configModule({
			schema_map: configMap.anchor_schema_map
		});
		
		// Configure and initialize feature modules
		spa.chat.configModule({
			set_chat_anchor: setChatAnchor,
			chat_model: spa.model.chat,
			people_model: spa.model.people,
		});
		spa.chat.initModule(jqueryMap.$container);
		
		// Handle URI anchor change events.
		// This is done /after/ all feature modules are configured and
		// initialized, otherwise they will not be ready to handle the
		// trigger event, which is used to ensure the anchor is considered
		// on-load.
		//
		$(window)
		.bind('resize', onResize)
		.bind('hashchange', onHashchange)
		.trigger('hashchange');
	};
	// End Public method /initModule/
	
	return {initModule: initModule};
	
	// ----------END PUBLIC METHODS----------
	
}());