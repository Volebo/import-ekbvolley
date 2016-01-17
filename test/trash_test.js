"use strict";

var
	expect = require('chai').expect,
	chai = require('chai')
;
chai.use(require('chai-datetime'));

describe('trash', function() {
	
	describe('trim', function() {
	
		var trash = require('../trash.js');
		it('should return empty', function () {
			var x = trash.trim(null);
			expect(x).to.be.null;
		});

		it('should return string', function () {
			var x = trash.trim('x');
			expect(x).not.to.be.null;
			expect(x).to.be.equal('x');
		});
	});
});
