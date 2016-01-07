"use strict";

;(function parser_load(self, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node, CommonJS-like
		module.exports = factory(
			require('jquery')
		);
	} else {
		// Browser globals (self is window)
		var parser = factory(self.jQuery);
		self.parser = parser;
	}
})(this, function parser_factory($){

  var undefined;

function getTimeZoneMs(){
	return 5 * 60 * 60 * 1000; // YEKT : 5 hours
}

function trim(s){
	if (!s)
		return s;
	return s.replace(/\s+$/, '').replace(/^\s+/, '');
}

/** Waits for a HTML-chunk with information about games 
*/
function parse (html)
{
	var state = {
		mode : null,
		played : [],
		cancelled : [],
	};
	html = "<body>" + html + "</body>";

	var b = $('<body/>').html(html);

	b.find('> *').map(function(i, e){
		var t = $(e).text();

		if (t.match(/^\s*АНОНСЫ?/i)){
			state.mode = 'anounce';
		} else if (t.match(/^\s*ОТМЕН[ЕЁ]Н/i)){
			state.mode = 'cancelled';
		} else if (t.match(/^\s*РЕЗУЛЬТАТ/i)){
			state.mode = 'played';
		} else if (t.match(/_{5,}/)){
			state.mode = 'annotation';
		} else if (t.match(/(\*\s+){3,}/)){
			state.mode = null;
		} else {
		
			if ( t.match(/^\s*$/) ){
				console.debug('skip empty');
			} else {
				// data anylysis
				parseLine(state, e);
			}
		}
	});

	return {
		played : state.played,
		cancelled : state.cancelled,
	};
	//fs.write('text.log', text, 'w+');
};

function parseLine(state, e)
{

	// var state = { mode : null };

	switch(state.mode)
	{
		case 'anounce':
			console.warn('anounce is not parsed >>>', e);
		break;
		case 'cancelled':
			var g = parseLineWithCancel(state, e);
			state.cancelled.push(g);
		break;
		case 'played':
			var game = parseLineWithResult(state, e);
			state.played.push(game);
		break;
		case 'annotation':
			console.warn('annotation is not parsed >>>', e);
		break;
	}
}

function parseLineWithCancel(state, e){
	var t = $(e).text();

	var game = {};

	game.raw = e;
	game.text = t;

	var m;
	if (m = t.match(
		/(\d+)\.(\d+)\.(\d{4}).+?(\d+):(\d+)[\.\s]+([-№а-яё\(\)\w\s\d]+?(?:\[F\])?)(?:\s+[-—]\s+)([-№а-яё\(\)\w\s\d]+(?:\[F\])?)\s*\[([-№,\.\(\)а-яё\w\d\s]+)\]\s*СУДЬЯ:([█\s]*)([-\?,\.а-яё\s]+)\s*\(\s*ОТМЕНЕНА\s*\)/i
		))
	{
		var ms = Date.UTC(m[3], parseInt(m[2])-1, m[1], m[4], m[5], 0);
		ms -= getTimeZoneMs();
		game.dt = new Date(ms);

		game.teamA = trim(m[6]);
		game.teamB = trim(m[7]);

		game.score = null; // raw

		game.gym = trim(m[8]);
		var rn = trim(m[9]);
		game.referee = trim(m[10]);

		var rne = false;
		if (rn){
			var dbg = [];

			for (var c=0; c < rn.length; c++ ){
				dbg.push(rn.charCodeAt(c));
			}

			rne = true;
		}
		
		game.referee_note = rn;
		game.referee_note_exists = rne;

		//console.debug(dt, game.teamA, game.teamB, game.score, gym, referee_note_exists, referee);
	} else {
		var eee = game.error = {
			comment : 'could not parse cancelled',
			raw : e,
		};

		console.error(eee.comment, eee);
	};

	return game;
}

function parseLineWithResult(state, e){
	var t = $(e).text();

	var game = {};

	game.raw = e;
	game.text = t;

	var m;
	if (m = t.match(
		/(\d+)\.(\d+)\.(\d{4}).+?(\d+):(\d+)[\.\s]+([-№а-яё\(\)\w\s\d]+?(?:\[F\])?)(?:\s+[-—]\s+)([-№а-яё\(\)\w\s\d]+(?:\[F\])?)\s*(\d:\d)\s*\[([-№,\.\(\)а-яё\w\d\s]+)\]\s*СУДЬЯ:([█\s]*)([-,\.а-яё\s]+)/i
		))
	{
		var ms = Date.UTC(m[3], parseInt(m[2])-1, m[1], m[4], m[5], 0);
		ms -= getTimeZoneMs();
		game.dt = new Date(ms);

		game.teamA = trim(m[6]);
		game.teamB = trim(m[7]);

		game.score = parseScore(trim(m[8])); // raw

		game.gym = trim(m[9]);
		var rn = trim(m[10]);
		game.referee = trim(m[11]);

		var rne = false;
		if (rn){
			var dbg = [];

			for (var c=0; c < rn.length; c++ ){
				dbg.push(rn.charCodeAt(c));
			}

			rne = true;
		}
		
		game.referee_note = rn;
		game.referee_note_exists = rne;

		// game protocol link id:
		var lid = $(e).find('a[dataquery]').attr('dataquery');
		if (lid){
			lid = lid.replace(/^#/, '');
		} else {
			lid = null;
		};

		game.links = [ {id : lid} ];

		//console.debug(dt, game.teamA, game.teamB, game.score, gym, referee_note_exists, referee);
	} else {
		var eee = game.error = {
			comment : 'could not parse played',
			raw : e,
		};

		//console.error(eee.comment, eee);
	};

	return game;
}

function parseScore(s){
	var m;
	m = s.match(/\s*(\d+)\s*:\s*(\d+)\s*/i);

	if (m){
		return [
			parseInt(m[1]),
			parseInt(m[2]),
		]
		;
	}

	return null;
}

var exports = {};
exports.parse = parse;

/* IF TEST */
exports.parseLineWithResult = parseLineWithResult;
/* END IF */


return exports;

/* CLOSURE TILL END OF FILE */
});
