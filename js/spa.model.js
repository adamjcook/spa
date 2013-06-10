/*
* spa.model.js
* Model module
*/

/* jslint        browser: true, continue: true,
   devel: true,  indent: 2,     maxerr: 50,
   newcap: true, nomen: true,   plusplus: true,
   regexp: true, sloppy: true,  vars: false,
   white: true
*/

/* global TAFFY, $, spa */

spa.model = (function() {
	
	'use strict';
	
	var configMap = {anon_id: 'a0'};
	var stateMap = {
			anon_user      : null,
			cid_serial     : 0,
			people_cid_map : {},
			people_db      : TAFFY(),
			user           : null,
			is_connected   : false
	};
	var isFakeData = true;
	var personProto;
	var makeCid;
	var clearPeopleDb;
	var completeLogin;
	var makePerson;
	var removePerson;
	var people;
	var chat;
	var initModule;
	
	personProto = {
			get_is_user: function() {
				return this.cid === stateMap.user.cid;
			},
			get_is_anon: function() {
				return this.cid === stateMap.anon_user.cid;
			}
	};
	
	makeCid = function() {
		return 'c' + String(stateMap.cid_serial++);
	};
	
	clearPeopleDb = function() {
		var user = stateMap.user;
		stateMap.people_db = TAFFY();
		stateMap.people_cid_map = {};
		if (user) {
			stateMap.people_db.insert(user);
			stateMap.people_cid_map[user.cid] = user;
		}
	};
	
	completeLogin = function(user_list) {
		var user_map = user_list[0];
		delete stateMap.people_cid_map[user_map.cid];
		stateMap.user.cid = user_map._id;
		stateMap.user.id = user_map._id;
		stateMap.user.css_map = user_map.css_map;
		stateMap.people_cid_map[user_map._id] = stateMap.user;
		chat.join();
		$.gevent.publish('spa-login', [stateMap.user]);
	};
	
	makePerson = function(person_map) {
		var person;
		var cid = person_map.cid;
		var css_map = person_map.css_map;
		var id = person_map.id;
		var name = person_map.name;
		
		if (cid === undefined || !name) {
			throw 'client id and name required';
		}
		
		person = Object.create(personProto);
		person.cid = cid;
		person.name = name;
		person.css_map = css_map;
		
		if (id) {
			person.id = id;
		}
		
		stateMap.people_cid_map[cid] = person;
		
		stateMap.people_db.insert(person);
		
		return person;
	};
	
	removePerson = function(person) {
		if (!person) {
			return false;
		}
		// Cannot remove anonymous person
		if (person.id === configMap.anon_id) {
			return false;
		}
		
		stateMap.people_db({cid: person.cid}).remove();
		delete stateMap.people_cid_map[person.cid];
		if (person.cid) {
			delete stateMap.people_cid_map[person.cid];
		}
		return true;
	};
	
	// The People API
	// --------------
	// This API is available from spa.model.people.
	// The model manages a list of people objects.
	// Its public methods include:
	//    * get_user() - return the current user person object.
	//      If the current user is not signed-in, an anonymous person object
	//      is returned.
	//    * get_db() - return the TaffyDB database of all the person objects
	//      - including the current user - pre-sorted.
	//    * get_by_cid( <client_id> ) - return a person object with provided
	//      unique id.
	//    * login( <user_name> ) - login as the user with the provided user
	//      name. The current user object is changed to reflect the new
	//      identity.
	//    * logout() - revert the current user object to anonymous.
	//
	// jQuery global events provided by the API include:
	//    * 'spa-login' is published when a user login process completes. The
	//       updated user object is provided as data.
	//    * 'spa-logout' is published when a logout completes. The former user
	//       object is provided as data.
	//
	// Each person is represented by a person object.
	// Person objects provide the following methods:
	//    * get_is_user() - return true if object is the current user
	//    * get_is_anon() - return true if object is anonymous
	//
	// The attributes for a person object include:
	//    * cid - string client id. This is always defined, and is only
	//      different from the id attribute if the client data is not synced
	//      with the server.
	//    * id - the unique id. This may be undefined if the object is not
	//      synced with the server.
	//    * name - the string name of the user.
	//    * css_map - a map of attributes used for avatar presentation.
	//
	people = (function() {
		var get_by_cid;
		var get_db;
		var get_user;
		var login;
		var logout;
		
		get_by_cid = function(cid) {
			return stateMap.people_cid_map[cid];
		};
		
		get_db = function() {
			return stateMap.people_db;
		};
		
		get_user = function() {
			return stateMap.user;
		};
		
		login = function(name) {
			var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			
			stateMap.user = makePerson({
				cid: makeCid(),
				css_map: {top: 25, left: 25, 'background-color':'#8f8'},
				name: name
			});
			
			sio.on('userupdate', completeLogin);
			
			sio.emit('adduser', {
				cid: stateMap.user.cid,
				css_map: stateMap.user.css_map,
				name: stateMap.user.name
			});
			
		};
		
		logout = function() {
			var is_removed;
			var user = stateMap.user;
			
			chat._leave();
			
			is_removed = removePerson(user);
			stateMap.user = stateMap.anon_user;
			
			$.gevent.publish('spa-logout', [user]);
			return is_removed;
		};
		
		return {
			get_by_cid : get_by_cid,
			get_db     : get_db,
			get_user   : get_user,
			login      : login,
			logout     : logout
		};
		
	}());
	
	// The Chat API
	// --------------
	// This API is available from spa.model.chat.
	// The Chat model provides methods and events to manage messaging. Its
	// public methods include:
	// Its public methods are:
	//    * join() - joins the chat room. This routine sets up the chat
	//      protocol with the server including publishers for 'spa-listchange'
	//      and 'spa-update' chat events.  If the current user is anonymous,
	//      join() aborts and returns false.
	//    * get_chatee() - retrun the person object with whom the user is
	//      chatting with. If there is no chatee, null is returned.
	//    * set_chatee( <person_id> ) - set the chatee to the person 
	//      identified  by person_id. If the person_id does not exist in the 
	//      People database, the chatee is set to null. If the person 
	//      requested is already the chatee, it returns false.
	//      Publishes a 'spa-setchatee' global event.
	//    * send_msg( <msg_text> ) - send a message to the chatee. It 
	//      publishes a 'spa-updatechat' global event. If the user is 
	//      anonymous or the chatee is null, it aborts and return false.
	//    * update_avatar( <update_avtr_map> ) - send the update_avtr_map to 
	//      the server. This results in an 'spa-listchange' event which 
	//      publishes the updated people list and avatar information (the 
	//      css_map in the person objects). The update_avtr_map requires must
	//      have the form { person_id: person_id, css_map: css_map }
	//
	// jQuery global events emitted by the Chat model include:
	//    * spa-setchatee - This is publishes when a new chatee is set. An 
	//      object of the form
	//      { old_chatee: <old_chatee_person_object>,
	//        new_chatee: <new_chatee_person_object> }
	//      is provided as data.
	//    * spa-listchange - This is published when the list of online people
	//      changes in length (i.e. when a person joins or leaves a chat) or 
	//      when their contents change (i.e. when a person's avatar details
	//      change).
	//    * spa-updatechat - This is publishes when a new message is recieved. 
	//      An object of the form
	//      { dest_id: <chatee_id>,
	//        dest_name: <chatee_name>,
	//        sender_id: <sender_id>,
	//        msg_text: <message_content>
	//      } is provided as data.
	//
	chat = (function() {
		
		var _publish_listchange;
		var _publish_updatechat;
		var _update_list;
		var _leave_chat;
		var get_chatee;
		var join_chat;
		var send_msg;
		var set_chatee;
		var update_avatar;
		var chatee = null;
		
		// Begin internal methods
		_update_list = function(arg_list) {
			var i;
			var person_map;
			var make_person_map;
			var people_list = arg_list[0];
			var is_chatee_online = false;
			
			clearPeopleDb();
			
			PERSON:
			for (i = 0; i < people_list.length; i++) {
				person_map = people_list[i];
				if (!person_map.name) {
					continue PERSON;
				}
				
				// If user is defined, update css_map and skip remainder
				if (stateMap.user && stateMap.user.id === person_map._id) {
					stateMap.user.css_map = person_map.css_map;
					continue PERSON;
				}
				
				make_person_map = {
						cid     : person_map._id,
						css_map : person_map.css_map,
						id      : person_map._id,
						name    : person_map.name
				};
				
				if (chatee && chatee.id === make_person_map.id) {
					is_chatee_online = true;
				}
				
				makePerson(make_person_map);
			}
			
			stateMap.people_db.sort('name');
			
			// If chatee is no longer online, we unset the chatee which
			// triggers the 'spa-setchatee' global event
			if (chatee && !is_chatee_online) {
				set_chatee('');
			}
		};
		
		_publish_listchange = function(arg_list) {
			_update_list(arg_list);
			$.gevent.publish('spa-listchange', [arg_list]);
		};
		
		_publish_updatechat = function(arg_list) {
			var msg_map = arg_list[0];
			
			if (!chatee) {
				set_chatee(msg_map.sender_id);
			}
			else if (msg_map.sender_id !== stateMap.user.id 
				&& msg_map.sender_id !== chatee.id) {
				set_chatee(msg_map.sender_id);
			}
			
			$.gevent.publish('spa-updatechat', [msg_map]);
		};
		// End internal methods
		
		_leave_chat = function() {
			var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			if (sio) {
				sio.emit('leavechat');
			}
		};
		
		get_chatee = function() {
			return chatee;
		};
		
		join_chat = function() {
			var sio;
			
			if (stateMap.is_connected) {
				return false;
			}
			
			if (stateMap.user.get_is_anon()) {
				console.warn('User must be defined before joining chat');
				return false;
			}
			
			sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			sio.on('listchange', _publish_listchange);
			sio.on('updatechat', _publish_updatechat);
			stateMap.is_connected = true;
			return true;
		};
		
		send_msg = function(msg_text) {
			var msg_map;
			var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			
			if (!sio) {
				return false;
			}
			if (!(stateMap.user && chatee)) {
				return false;
			}
			
			msg_map = {
				dest_id   : chatee.id,
				dest_name : chatee.name,
				sender_id : stateMap.user.id,
				msg_text  : msg_text
			};
			
			// Publish 'updatechat' so the outgoing messages will show
			_publish_updatechat([msg_map]);
			sio.emit('updatechat', msg_map);
			return true;
		};
		
		set_chatee = function(person_id) {
			var new_chatee;
			new_chatee = stateMap.people_cid_map[person_id];
			if (new_chatee) {
				if (chatee && chatee.id === new_chatee.id) {
					return false;
				}
			} else {
				new_chatee = null;
			}
			
			$.gevent.publish('spa-setchatee', 
				{old_chatee : chatee, new_chatee : new_chatee}
			);
			chatee = new_chatee;
			return true;
		};
		
		// The avatar_update_map should have the form:
		// { person_id : <string>, css_map : {
		//   top : <int>, left : <int>, 
		//   'background-color' : <string>
		// }};
		//
		update_avatar = function(avatar_update_map) {
			var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
			if (sio) {
				sio.emit('updateavatar', avatar_update_map);
			}
		};
		
		return {
			_leave        : _leave_chat,
			get_chatee    : get_chatee,
			join          : join_chat,
			send_msg      : send_msg,
			set_chatee    : set_chatee,
			update_avatar : update_avatar
		};
		
		
	}());
	
	initModule = function() {
		var i;
		var people_list;
		var person_map;
		
		// Initialize anonymous person
		stateMap.anon_user = makePerson({
			cid: configMap.anon_id,
			id: configMap.anon_id,
			name: 'anonymous'
		});
		
		stateMap.user = stateMap.anon_user;
	};
	
	return {
		initModule : initModule,
		chat       : chat,
		people     : people
	};
	
}());