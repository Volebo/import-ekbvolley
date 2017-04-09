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

'use strict'

const debug   = require('debug')('volebo:import:ekbvolley:main')
const _       = require('lodash')
const jsdom   = require('jsdom')
const request = require('request')
const parser  = require('./parser')


/* serialize cyclic */
function str(obj){
	let seen = [];
	const _seen = _(seen);

	const res = JSON.stringify(obj, function(_unused__key, val) {
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


const url = "http://www.ekbvolley.com";

let crawl = _([
	{ id: 'cwov', name : '', suf:'#!-2015-2016--/cwov', tour : 11 },
	//{ id: 'pnis6', name : '' },
]);

const processCrawlData = function(crawl)
{
	crawl.forEach(function forEachCrawl(x){

		request(x.url, function parseRequestOfSecondStep(error, response, body){
			if (!error && response.statusCode === 200)
			{
				const raw = body;
				const json = JSON.parse(raw);

				let textNodeId = _.get(json, 'structure.components[0].dataQuery');
				textNodeId = _.trimLeft(textNodeId, '#');

				const text = json.data.document_data[textNodeId].text; // _.get(json, 'data.' + textNodeId + '.text')

				const games = parser.parse(text);

				const res = _(games.played)
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
			const data = window.publicModel;
			const _pages = _(data.pageList.pages);

			crawl = crawl
				.map(function (pgd){
					const f = _pages.find('pageId', pgd.id);
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
