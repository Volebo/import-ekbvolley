"use strict";

;(function parser_load(self, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node, CommonJS-like
		module.exports = factory(
		);
	} else {
		// Browser globals (self is window)
		self.trash = factory();
	}
})(this, function parser_factory(){

function trim(s){
	if (!s)
		return s;
	return s.replace(/\s+$/, '').replace(/^\s+/, '');
}

var exports = {};
exports.trim=trim;

return exports;

/* CLOSURE TILL END OF FILE */
});
