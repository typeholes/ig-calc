#!/usr/bin/sh

git diff HEAD changelog.txt | tail --lines='+5' | grep '^\+'  | sed 's/^\+//;/^\s*$/d'

