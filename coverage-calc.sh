#!/bin/sh

# ./node_modules/.bin/
istanbul cover _mocha --report lcovonly -- --recursive  -R spec test/*.js
