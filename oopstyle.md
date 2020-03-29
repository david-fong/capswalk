
# OOP Style

This is to cover more abstract practices than rules that are covered by linting.

## ES6 #private fields

Methodology: Use #private fields for fields that back accessors- Ie. Fields that need to be internally reassigned, but should never be directly reassigned externally. If such a field does not have a get-accessor (because it doesn't need one, leave it- do not switch it to use hard privacy.
