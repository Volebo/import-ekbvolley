#!/bin/sh

./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha --report lcovonly -- --recursive  -R spec
