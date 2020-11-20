#!/bin/sh
# This is for development purposes only.

# --frozen-intrinsics \ # cjs >:(
# --experimental-policy='policy.json' \
# --disallow-code-generation-from-strings # >:( depd
node --enable-source-maps --disable-proto=delete "./dist/server/index.js"
