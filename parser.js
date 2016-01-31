"use strict";

/*
 * LOADER BLOCK
 */
(function parser_load(self, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['cheerio'], factory);
	} else if (typeof exports === 'object') {
		// Node, CommonJS-like
		module.exports = factory(
			require('cheerio')
		);
	} else {
		// Browser globals (self is window)
		var parser = factory(self.jQuery);
		self.parser = parser;
	}
})

/*
 * / LOADER BLOCK
 */

(this, function parser_factory($){



function getTimeZoneMs(){
	return 5 * 60 * 60 * 1000; // Ekb volley uses YEKT : +5 hours
}

function trim(s){
	if (!s)
		return s;
	return s.replace(/\s+$/, '').replace(/^\s+/, '');
}

function fixBlank(s){
	if (!s)
		return s;
	return s.replace(/\s+/, ' ');
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
				console.log('skip empty');
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
}

function parseLine(state, e)
{

	// var state = { mode : null };

	switch(state.mode)
	{
		case 'anounce':
			console.warn('anounce is not parsed >>>', $(e).text());
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
			console.warn('annotation is not parsed >>>', $(e).text());
		break;
	}
}

/* internal, so it have many params */
function commonGameData(game, Y, M, D, h, m, t1, t2, gym, ref, rnote){

	Y = parseInt(Y);
	M = parseInt(M)-1;
	D = parseInt(D);
	h = parseInt(h);
	m = parseInt(m);

	var ms = Date.UTC(Y, M, D, h, m, 0);
	ms -= getTimeZoneMs();
	game.dt = new Date(ms);

	game.teamA = fixBlank(trim(t1));
	game.teamB = fixBlank(trim(t2));

	game.gym = fixBlank(trim(gym));
	var rn = trim(rnote);
	game.referee = fixBlank(trim(ref));

	var rne = false;
	if (rn){
		/*
		// TODO : do you really need this code: 
		var dbg = [];
		for (var c=0; c < rn.length; c++ ){
			dbg.push(rn.charCodeAt(c));
		}
		*/
		rne = true;
	}
	
	game.referee_note = rn;
	game.referee_note_exists = rne;

	return game;
}

function parseLineWithCancel(state, e){
	var t = $(e).text();

	var game = {};

	game.raw = $(e).html();
	game.text = t;

	var m = t.match(
		/(\d+)\.(\d+)\.(\d{4}).+?(\d+):(\d+)[\.\s]+([-№а-яё\(\)\w\s\d]+?(?:\[F\])?)(?:\s+[-—]\s+)([-№а-яё\(\)\w\s\d]+(?:\[F\])?)\s*\[([-№,\.\(\)а-яё\w\d\s]+)\]\s*СУДЬЯ:([█\s]*)([-\?,\.а-яё\s]+)\s*\(\s*ОТМЕНЕНА\s*\)/i
		);
	if (m)
	{
		commonGameData(game, m[3], m[2], m[1], m[4], m[5],	// dt
			m[6], m[7], // teams
			m[8],	// gym
			m[10],	// ref
			m[9]	// rn
		);
		game.score = null;

		//console.debug(dt, game.teamA, game.teamB, game.score, gym, referee_note_exists, referee);
	} else {
		var eee = game.error = {
			comment : 'could not parse cancelled',
			raw : game.raw,
		};

		console.error(eee.comment, eee);
	}

	return game;
}

function parseLineWithResult(state, e){
	var t = $(e).text();

	var game = {};

	game.raw = $(e).html();
	game.text = t;

	var m = t.match(
		/(\d+)\.(\d+)\.(\d{4}).+?(\d+):(\d+)[\.\s]+([-№а-яё\(\)\w\s\d]+?(?:\[F\])?)(?:\s+[-—]\s+)([-№а-яё\(\)\w\s\d]+(?:\[F\])?)\s*(\d:\d)\s*\[([-№,\.\(\)а-яё\w\d\s]+)\]\s*СУДЬЯ:([█\s]*)([-,\.а-яё\s]+)/i
	);
	if (m)
	{
		commonGameData(game, m[3], m[2], m[1], m[4], m[5],	// dt
			m[6], m[7], // teams
			m[9],	// gym
			m[11],	// ref
			m[10]	// rn
		);
		game.score = parseScore(trim(m[8])); // raw

		// game protocol link id:
		var lid = $(e).find('a[dataquery]').attr('dataquery');
		if (lid){
			lid = lid.replace(/^#/, '');
		} else {
			lid = null;
		}

		game.links = [ {id : lid} ];

		//console.debug(dt, game.teamA, game.teamB, game.score, gym, referee_note_exists, referee);
	} else {
		var eee = game.error = {
			comment : 'could not parse played',
			raw : game.raw,
		};

		//console.error(eee.comment, eee);
	}

	return game;
}

function parseScore(s){
	if (!s)
		return null;

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
exports.parseLineWithCancel = parseLineWithCancel;
exports.parseScore = parseScore;
/* END IF */


return exports;

/* CLOSURE TILL END OF FILE */
});
