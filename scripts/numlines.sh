#!/bin/sh
# currently not counting json files
wc -l $(git ls-files | \grep -E "[.](js|ts|html|css)$") | sort
