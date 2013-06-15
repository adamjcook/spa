/*
* spa.avtr.js
* Avatar feature module for SPA
*/

/* jslint        browser: true, continue: true,
   devel: true,  indent: 2,     maxerr: 50,
   newcap: true, nomen: true,   plusplus: true,
   regexp: true, sloppy: true,  vars: false,
   white: true
*/

/* global $, spa */

spa.avtr = (function() {
	
	'use strict';

	// ----------BEGIN MODULE SCOPE VARIABLES----------
	
	var configMap = {
		chat_model: null,
		people_model: null,
		
		settable_map: {
			chat_model: true,
			people_model: true
		}
	};
	var stateMap = {
		drag_map: null,
		$drag_target: null,
		drag_bg_color: undefined
	};
	var jqueryMap = {};
	var getRandRgb;
	var setJqueryMap;
	var updateAvatar;
	var onTapNav;
	var onHeldstartNav;
	var onHeldmoveNav;
	var onHeldendNav;
	var onSetchatee;
	var onListchange;
	var onLogout;
	var configModule;
	var initModule;
	
	// ----------END MODULE SCOPE VARIABLES----------
	
	// ----------BEGIN UTILITY METHODS----------
	
	getRandRgb = function() {
		var i;
		var rgb_list = [];
		
		for (i = 0; i < 3; i++) {
			rgb_list.push(Math.floor(Math.random() * 128) + 128);
		}
		return 'rgb(' + rgb_list.join(',') + ')';
	};
	
	// ----------END UTILITY METHODS----------
	
	// ----------BEGIN DOM METHODS----------
	
	// Begin DOM method /setJqueryMap/
	setJqueryMap = function($container) {
		jqueryMap = {
			$container: $container
		};
	};
	// End DOM method /setJqueryMap/
	
	// Begin DOM method /updateAvatar/
	updateAvatar = function($target) {
		var css_map;
		var person_id;
		
		css_map = {
			top: parseInt($target.css('top'), 10),
			left: parseInt($target.css('left'), 10),
			'background-color': $target.css('background-color')
		};
		person_id = $target.attr('data-id');
		
		configMap.chat_model.update_avatar({
			person_id: person_id,
			css_map: css_map
		});
	};
	// End DOM method /updateAvatar/
	
	// ----------END DOM METHODS----------
	
	// ----------BEGIN EVENT HANDLERS----------
	
	onTapNav = function(event) {
		var css_map;
		var $target = $(event.elem_target).closest('.spa-avtr-box');
		
		if ($target.length === 0) {
			return false;
		}
		
		$target.css({
			'background-color': getRandRgb()
		});
		updateAvatar($target);
	};
	
	onHeldstartNav = function(event) {
		var offset_target_map;
		var offset_nav_map;
		var $target = $(event.elem_target).closest('.spa-avtr-box');
		
		if ($target.length === 0) {
			return false;
		}
		
		stateMap.$drag_target = $target;
		offset_target_map = $target.offset();
		offset_nav_map = jqueryMap.$container.offset();
		
		offset_target_map.top -= offset_nav_map.top;
		offset_target_map.left -= offset_nav_map.left;
		
		stateMap.drag_map = offset_target_map;
		stateMap.drag_bg_color = $target.css('background-color');
		
		$target
		.addClass('spa-x-is-drag')
		.css('background-color','');
	};
	
	onHeldmoveNav = function(event) {
		var drag_map = stateMap.drag_map;
		if (! drag_map) {
			return false;
		}
		
		drag_map.top += event.px_delta_y;
		drag_map.left += event.px_delta_x;
		
		stateMap.$drag_target.css({
			top  : drag_map.top,
			left : drag_map.left
		});
	};
	
	onHeldendNav = function(event) {
		var $drag_target = stateMap.$drag_target;
		if (! $drag_target) {
			return false;
		}
		
		$drag_target
		.removeClass('spa-x-is-drag')
		.css('background-color', stateMap.drag_bg_color);
		
		stateMap.drag_bg_color = undefined;
		stateMap.$drag_target = null;
		stateMap.drag_map = null;
		updateAvatar($drag_target);
	};
	
	onSetchatee = function(event, arg_map) {
		var $nav       = $(this);
		var new_chatee = arg_map.new_chatee;
		var old_chatee = arg_map.old_chatee;
		
		// Use this to highlight avatar of user in nav area
		// See new_chatee.name, old_chatee.name, etc.
		
		// Remove highlight from old_chatee avatar here
		if (old_chatee) {
			$nav
			.find('.spa-avtr-box[data-id=' + old_chatee.cid + ']')
			.removeClass('spa-x-is-chatee');
		}
		
		// Add highlight to new_chatee avatar here
		if (new_chatee) {
			$nav
			.find('.spa-avtr-box[data-id=' + new_chatee.cid + ']')
			.addClass('spa-x-is-chatee');
		}
	};
	
	onListchange = function(event) {
		var $nav      = $(this);
		var people_db = configMap.people_model.get_db();
		var user      = configMap.people_model.get_user();
		var chatee    = configMap.chat_model.get_chatee() || {};
		var $box;
		
		$nav.empty();
		
		// If the user is logged out, do not render
		if (user.get_is_anon()) {
			return false;
		}
		
		people_db().each(function(person, idx) {
			var class_list;
			
			if (person.get_is_anon()) {
				return true;
			}
			
			class_list = ['spa-avtr-box'];
			
			if (person.id === chatee.id) {
				class_list.push('spa-x-is-chatee');
			}
			
			if (person.get_is_user()) {
				class_list.push('spa-x-is-user');
			}
			
			$box = $('<div/>')
			.addClass(class_list.join(' '))
			.css(person.css_map)
			.attr('data-id', String(person.id))
			.prop('title', spa.util_b.encodeHtml(person.name))
			.text(person.name)
			.appendTo($nav);
		});
	};
	
	onLogout = function() {
		jqueryMap.$container.empty();
	}
	
	// ----------END EVENT HANDLERS----------
	
	// ----------BEGIN PUBLIC METHODS----------
	
	// Begin public method /configModule/
	// Example: spa.avtr.configModule({...});
	// Purpose: Configure the module prior to initialization, values not
	//    expected to change during a user session.
	// Action: The internal configuration data structure (configMap) is 
	//    updated with provided arguments. No other actions are taken.
	// Returns: none
	// Throws: JavaScript error object and stack trace on unacceptable or 
	//    missing arguments.
	//
	configModule = function(input_map) {
		spa.util.setConfigMap({
			input_map: input_map,
			settable_map: configMap.settable_map,
			config_map: configMap
		});
		return true;
	};
	// End public method /configModule/
	
	// Begin public method /initModule/
	// Example: spa.avtr.initModule($container);
	// Purpose: Directs the module to begin offering its feature
	// Arguments: $container - container to use
	// Action: Provides avatar interface for chat users
	// Returns: none
	// Throws: none
	//
	initModule = function($container) {
		setJqueryMap($container);
		
		// Bind model global events
		$.gevent.subscribe(jqueryMap.$container, 'spa-setchatee',  onSetchatee);
		$.gevent.subscribe(jqueryMap.$container, 'spa-listchange', onListchange);
		$.gevent.subscribe(jqueryMap.$container, 'spa-logout', onLogout);
		
		// Bind actions
		jqueryMap.$container
		.bind('utap',       onTapNav       )
		.bind('uheldstart', onHeldstartNav )
		.bind('uheldmove',  onHeldmoveNav  )
		.bind('uheldend',   onHeldendNav   );
		
		return true;
	};
	// End public method /initModule/
	
	// Return public methods
	return {
		configModule: configModule,
		initModule: initModule
	};
	
	// ----------END PUBLIC METHODS----------
	
}());