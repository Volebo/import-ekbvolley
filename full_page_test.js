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

const debug     = require('debug')('volebo:import:ekbvolley:fulltest');
const _         = require('lodash')
const casperPkg = require('casper')
const $         = require('jquery')
// utils = require('utils')
// fs = require('fs')



const str = JSON.stringify;

const url = "http://www.ekbvolley.com";
// url = "http://www.ekbvolley.com/#!-2015-2016--/cwov";
const crawl = _([
	{ id: 'cwov', name : '', suf:'#!-2015-2016--/cwov', tour : 11 },
	//{ id: 'pnis6', name : '' },
]);

const casper = casperPkg.create({
	verbose: true,
	logLevel : "info"
})

/*
casper.start(url, function() {

	var data = this.getGlobal('publicModel');
	var ld = _(data.pageList.pages);

	crawl = crawl
		.map(function (pgd){
			var f = ld.find('pageId', pgd.id);
			if (f){
				pgd.url = f.urls[0];
				return pgd;
			} else {
				console.debug('INITIAL LOAD: not found:', pgd.id, _(pgd.name));
				return null;
			}
		})
		.compact();
});
*/

casper.start(url);

crawl.forEach( function crawlEach( c ){
	casper.thenOpen( url + c.suf , function crawEachThenOpen(/* re */){
		const html = this.getPageContent();
		const b = $('<body/>').html(html).contents();

		debug(str(b.find('span')));
	});
}).value();

casper.run(function(){
	casper.die('it is all!');
});

/*
casper.then( function x (){
	crawl.forEach(function forEachCrawl(x){
		casper.thenOpen( x.url, function openData(){
			var raw = this.getPageContent();
			var json = JSON.parse(raw);

			var textNodeId = _.get(json, 'structure.components[0].dataQuery');
			textNodeId = _.trimLeft(textNodeId, '#');

			console.log(textNodeId);
			if (! json) console.log('json');
			if (! json.data) console.log('json.data');
			if (! json.data[textNodeId]) console.log('json.data[textNodeId]');

			var text = json.data.document_data[textNodeId].text; // _.get(json, 'data.' + textNodeId + '.text')
			console.log('textnode id:', textNodeId);
			console.log('text:', text);

			//fs.write('text.log', text, 'w+');
			//this.log( text );
			//console.debug('json.data', utils.dump(json.data));

		});
	}).value();
});

casper.run();
*/
