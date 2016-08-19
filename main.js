/*
Sync volebo.net with ekbvolley.com

Copyright (C) 2016  Volebo <volebo.net@gmail.com>
Copyright (C) 2016  Koryukov Maksim <maxkoryukov@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the MIT License, attached to this software package.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

You should have received a copy of the MIT License along with this
program. If not, see <https://opensource.org/licenses/MIT>.

http://spdx.org/licenses/MIT
*/

"use strict";

var
	_ = require('lodash'),
	jsdom = require('jsdom'),
	request = require('request'),

	parser = require('./parser')
	;

const debug           = require('debug')('volebo:import:ekbvolley:main');

/* serialize cyclic */
function str(obj){
	var seen = [];
	var _seen = _(seen);

	var res = JSON.stringify(obj, function(key, val) {
		if (val && (typeof val === "object")) {
			if (_seen.includes(val)) {
				return;
			}
			seen.push(val);
		}
		return val;
	});
	seen = null;
	return res;
}
/* serialize cyclic */


var url = "http://www.ekbvolley.com";

var crawl = _([
	{ id: 'cwov', name : '', suf:'#!-2015-2016--/cwov', tour : 11 },
	//{ id: 'pnis6', name : '' },
]);

var processCrawlData = function(crawl)
{
	crawl.forEach(function forEachCrawl(x){

		request(x.url, function parseRequestOfSecondStep(error, response, body){
			if (!error && response.statusCode === 200)
			{
				var raw = body;
				var json = JSON.parse(raw);

				var textNodeId = _.get(json, 'structure.components[0].dataQuery');
				textNodeId = _.trimLeft(textNodeId, '#');

				var text = json.data.document_data[textNodeId].text; // _.get(json, 'data.' + textNodeId + '.text')

				var games = parser.parse(text);

				var res = _(games.played)
					.map( function (g) { return _(g).omit('raw'); } )
					//.map( )
					;

				debug( str(res) );
				//fs.write('text.log', text, 'w+');
				//this.log( text );
				//console.debug('json.data', utils.dump(json.data));

			} else {
				console.error( 'resp error : ', response.statusCode, 'error :', error);
			}
		});
	}).value();
};

jsdom.env({
	url: url,
	scripts: ["http://code.jquery.com/jquery.js"],

	/* empty node required */
	features: {
	//FetchExternalResources: ["script"],
	//ProcessExternalResources: ["script"],
	//SkipExternalResources: false,
	//MutationEvents: '2.0',
	},

	done: function (err, window) {

		if (err){
			console.error(err);
			return err;
		} else
		{
			var data = window.publicModel;
			var _pages = _(data.pageList.pages);

			crawl = crawl
				.map(function (pgd){
					var f = _pages.find('pageId', pgd.id);
					if (f){
						pgd.url = f.urls[0];
						return pgd;
					} else {
						console.warn('INITIAL LOAD: not found:', pgd.id, _(pgd.name));
						return null;
					}
				})
				.compact();

			processCrawlData(crawl);

			return 0;
		}
	}
});
