"use strict";

var
	_ = require('lodash'),
	casper = require('casper').create(
		{ verbose: true, logLevel : "debug" }
	),
	utils = require('utils'),
	fs = require('fs'),
	$ = require('jquery'),

	parser = require('./parser')
;


/* serialize cyclic */
function str(obj){
	var seen = [];
	var _seen = _(seen);
	
	var res = JSON.stringify(obj, function(key, val) {
		if (val != null && typeof val == "object") {
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
// url = "http://www.ekbvolley.com/#!-2015-2016--/cwov";
var crawl = _([
	{ id: 'cwov', name : '', suf:'#!-2015-2016--/cwov', tour : 11 },
	//{ id: 'pnis6', name : '' },
]);

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

casper.then( function x (){
	crawl.forEach(function forEachCrawl(x){
		casper.thenOpen( x.url, function openData(){
			var raw = this.getPageContent();
			var json = JSON.parse(raw);

			var textNodeId = _.get(json, 'structure.components[0].dataQuery');
			textNodeId = _.trimLeft(textNodeId, '#');

			var text = json.data.document_data[textNodeId].text; // _.get(json, 'data.' + textNodeId + '.text')

			var games = parser.parse(text);

			var res = _(games.played)
				.map( function (g) { return _(g).omit('raw'); } )
				//.map( )
				;

			console.debug( str(res) );

			//fs.write('text.log', text, 'w+');
			//this.log( text );
			//console.debug('json.data', utils.dump(json.data));

		});
	}).value();
});

casper.run();

