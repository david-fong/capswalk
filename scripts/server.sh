#!/bin/sh
# This is for development purposes only.

# --frozen-intrinsics \ # cjs >:(
# --experimental-policy='policy.json' \
# --disallow-code-generation-from-strings # >:( depd
# [[ "${BASH_SOURCE[0]}" != "${0}" ]] \
#     && exec node --enable-source-maps --disable-proto=delete "./dist/server/index.js" \
#     ||      node --enable-source-maps --disable-proto=delete "./dist/server/index.js" ;
