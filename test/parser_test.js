/* globals casper: false */

'use strict';

var
	expect = require('chai').expect,
	$ = require('cheerio'),
	chai = require('chai')
;
chai.use(require('chai-datetime'));

describe('parser', function() {

	describe('.parseLineWithResult', function () {
		
		var tests = [
			//04.12.2015. 20:00. УКС-ГРУПП — ИВРОМ ТРЕЙД  3:0  [УГМУ] СУДЬЯ: █ САУЛЯК А.В.
			{
				html : '<p class="font_8"><span style="font-size:14px;"><span style="font-size:14px;"><span style="text-decoration:underline;"><a dataquery="#textLink_ihyoear8"><span style="font-size:14px;"><span style="font-size:14px;"><span style="font-family: helvetica-w01-roman, helvetica-w02-roman, helvetica-lt-w10-roman, sans-serif;">04.12.2015. 20:00.&nbsp;</span><span style="font-family: helvetica-w01-roman, helvetica-w02-roman, helvetica-lt-w10-roman, sans-serif; font-weight: bold;">УКС-ГРУПП — <span style="font-weight:bold"><span style="font-weight:bold">ИВРОМ ТРЕЙД &nbsp;3:0</span></span></span><span style="font-family: helvetica-w01-roman, helvetica-w02-roman, helvetica-lt-w10-roman, sans-serif;"><span style="font-weight:bold;">&nbsp;&nbsp;</span>[</span><span style="font-family: helvetica-w01-roman, helvetica-w02-roman, helvetica-lt-w10-roman, sans-serif; font-weight: bold;"><span class="color_34">УГМУ</span></span><span style="font-family: helvetica-w01-roman, helvetica-w02-roman, helvetica-lt-w10-roman, sans-serif;">] СУДЬЯ: <span class="color_28">█&nbsp;</span>САУЛЯК А.В.</span></span></span></a></span></span></span></p>',
				dt : new Date(Date.UTC(2015, 11, 4, 15, 0, 0)),
				teamA : 'УКС-ГРУПП',
				link_id : 'textLink_ihyoear8'
			},

			// 10.10.2015. 18:00. ЛОКОМОТИВ ИЗУМРУД - ЛИЦЕЙ № 180 — К ТЕЛЕКОМ  1:3  [ГАГАРИНА, 30] СУДЬЯ: САУЛЯК А.В.
			{
				html : '<p class="font_8"><span style="text-decoration:underline;"><a dataquery="#textLink_ih5tbxew"><span style="font-family: helvetica-w01-roman,helvetica-w02-roman,helvetica-lt-w10-roman,sans-serif; font-size: 14px;">10.10.2015. 18:00.&nbsp;</span><span style="font-weight:bold;">ЛОКОМОТИВ ИЗУМРУД&nbsp;-&nbsp;ЛИЦЕЙ № 180</span><span style="font-family: helvetica-w01-roman,helvetica-w02-roman,helvetica-lt-w10-roman,sans-serif; font-size: 14px; font-weight: bold;"> — </span><span style="font-weight:bold;">К ТЕЛЕКОМ &nbsp;1:3</span><span style="font-family: helvetica-w01-roman,helvetica-w02-roman,helvetica-lt-w10-roman,sans-serif; font-size: 14px;">&nbsp; [</span><span style="font-family: helvetica-w01-roman,helvetica-w02-roman,helvetica-lt-w10-roman,sans-serif; font-size: 14px; font-weight: bold;"><span class="color_34">ГАГАРИНА, 30</span></span><span style="font-family: helvetica-w01-roman,helvetica-w02-roman,helvetica-lt-w10-roman,sans-serif; font-size: 14px;">] СУДЬЯ: </span>САУЛЯК А.В.</a></span></p>',
				dt : new Date(Date.UTC(2015, 9, 10, 13, 0, 0)),
				teamA : 'ЛОКОМОТИВ ИЗУМРУД - ЛИЦЕЙ № 180',
				link_id : 'textLink_ih5tbxew'
			},
		];

		tests.forEach( function(data){

			var state = { mode : 'played', played : [] };
			var parser = require('../parser.js');

			var html = $('<p/>').html(data.html);
			
			var x = parser.parseLineWithResult(state, html);
			
			it('should not be an error', function () {
				expect(x).to.not.have.property('error');
			});
			it('should has teamA', function () {
				expect(x).to.have.property('teamA').to.equal(data.teamA);
			});
			it('should gather date', function () {
				expect(x).to.have.property('dt').to.equalDate(data.dt).to.equalTime(data.dt);
			});
			it('should contain data link', function () {
				expect(x).to.have.property('links').to.be.a('array');
				expect(x.links).to.have.length.above(0);
				expect(x.links[0]).to.have.property('id', data.link_id);
			});

		});

	});


	describe('.parseLineWithCancel', function () {
		
		var tests = [
			// 11.11.2015. 19:30. УРГЮУ — ЕТТУ-1 [F]  [ГИМНАЗИЯ № 47] СУДЬЯ: КОПЕЛЕВ Б.И. (ОТМЕНЕНА)
			{
				html : '<p class="font_8"><span class="color_17">11.11.2015. 19:30. <span style="font-weight:bold;">УРГЮУ — <span style="font-weight:bold"><span style="font-weight:bold"><span style="font-weight:bold">ЕТТУ-1&nbsp;<span style="font-weight:bold">[F]</span></span></span></span></span>&nbsp; [<span style="font-weight:bold;">ГИМНАЗИЯ № 47</span>] СУДЬЯ: КОПЕЛЕВ Б.И. (ОТМЕНЕНА)</span></p>',
				dt : new Date(Date.UTC(2015, 10, 11, 14, 30, 0)),
				teamA : 'УРГЮУ',
			},
		];

		tests.forEach( function(data){

			var state = { mode : 'cancelled', cancelled : [] };
			var parser = require('../parser.js');

			var html = $('<p/>').html(data.html);
			
			var x = parser.parseLineWithCancel(state, html);
			
			it('should not be an error', function () {
				expect(x).to.not.have.property('error');
			});
			it('should has teamA', function () {
				expect(x).to.have.property('teamA').to.equal(data.teamA);
			});
			it('should gather date', function () {
				expect(x).to.have.property('dt').to.equalDate(data.dt).to.equalTime(data.dt);
			});

		});

	});


	describe('.parseScore', function () {
		
		var tests = [
			{
				str : '1  : 0',
				s : [1, 0]
			},
			{
				str : '5:2',
				s : [5, 2]
			},
			{
				str : '3:1',
				s : [3, 1]
			},
			{
				str : '2:3',
				s : [2, 3]
			},
		];
		
		tests.forEach( function(data){	
			var parser = require('../parser.js');
			var x = parser.parseScore(data.str);
			
			it('should not be an error', function () {
				expect(x).to.not.have.property('error');
			});
			it('should has teamA', function () {
				expect(x).to.be.a('array');
			});

			it('is of two elements', function() {
				expect(x).to.have.length(2);
			});

			it('correct score', function() {
				expect(x).to.eql(data.s);
			});
		});

	});
});
