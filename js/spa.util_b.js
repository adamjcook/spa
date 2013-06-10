/*
* spa.util_b.js
* JavaScript utilities - expects a browser
*/

/* jslint        browser: true, continue: true,
   devel: true,  indent: 2,     maxerr: 50,
   newcap: true, nomen: true,   plusplus: true,
   regexp: true, sloppy: true,  vars: false,
   white: true
*/

/* global $, spa, getComputedStyle */

spa.util_b = (function() {
	
	// ----------BEGIN MODULE SCOPE VARIABLES----------
	
	var configMap = {
			regex_encode_html: /[&"'><]/g,
			regex_encode_noamp: /["'><]/g,
			html_encode_map: {
				'&': '&#38;',
				'"': '&#34;',
				"'": '&#39;',
				'>': '&#62;',
				'<': '&#60;'
			}
	};
	var decodeHtml;
	var encodeHtml;
	var getEmSize;
	
	configMap.encode_noamp_map = $.extend({}, configMap.html_encode_map);
	
	delete configMap.encode_noamp_map['&'];
	
	// ----------END MODULE SCOPE VARIABLES----------
	
	// ----------BEGIN UTILITY METHODS----------
	
	// Begin utility method /decodeHtml/
	// Decodes HTML entities in a browser-friendly way
	decodeHtml = function(str) {
		return $('<div/>').html(str || '').text();
	};
	// End utility method /decodeHtml/
	
	// Begin utility method /encodeHtml/
	// This is single pass encoder for html entities and handles an arbitrary
	// number of characters.
	//
	encodeHtml = function(input_arg_str, exclude_map) {
		var input_str = String(input_arg_str);
		var regex;
		var lookup_map;
		
		if (exclude_map) {
			lookup_map = configMap.encode_noamp_map;
			regex = configMap.regex_encode_noamp;
		} else {
			lookup_map = configMap.html_encode_map;
			regex = configMap.regex_encode_html;
		}
		return input_str.replace(regex, 
				function(match, name) {
					return lookup_map[match] || '';
				}
		);
	};
	// End utility method /encodeHtml/
	
	// Begin utility method /getEmSize/
	getEmSize = function(el) {
		return Number(
				getComputedStyle(el, '').fontSize.match(/(\d.+)px/)[1]
				);
	};
	// End utility method /getEmSize/
	
	// ----------END UTILITY METHODS----------
	
	return {
		decodeHtml : decodeHtml,
		encodeHtml : encodeHtml,
		getEmSize  : getEmSize
	};
	
}());
