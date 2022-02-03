#!/bin/sh
git rm -r --cached --quiet .
mv client/.git client/.git~
git add .
mv client/.git~ client/.git
