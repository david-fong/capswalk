#!/bin/sh
git rm -r --cached .
mv client/.git client/.git~
git add .
mv client/.git~ client/.git