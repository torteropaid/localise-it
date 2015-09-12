#!/bin/bash

HOST="https://localhost:8080"

function request() {
	curl -s -b cookies -c cookies --insecure $*
}

request -X POST $HOST/auth/logout
request -X POST -d 'username=root&password=toor' $HOST/auth/login

request -X DELETE $HOST/api/project/sample 2>&1 > /dev/null
request -X PUT -d '{}' $HOST/api/project/sample 2>&1 > /dev/null

request -X POST -d '{"pid":"sample","key":"general.ok","translations":{"en_gb":"ok"}}' $HOST/api/translation/ 2>&1 > /dev/null
request -X POST -d '{"pid":"sample","key":"general.yes","translations":{"en_gb":"yes"}}' $HOST/api/translation/ 2>&1 > /dev/null
request -X POST -d '{"pid":"sample","key":"general.no","translations":{"en_gb":"no"}}' $HOST/api/translation/ 2>&1 > /dev/null
request -X POST -d '{"pid":"sample","key":"general.fuck","translations":{"en_gb":"fuck"}}' $HOST/api/translation/ 2>&1 > /dev/null

request -X GET $HOST/langfile/sample/en_gb
echo -en "\n"

request -X POST -d '{"general.fuck":"fuck!","general.no":"nope...","general.ok":"ok!","general.yes":"yes!","general.yeah":"yeah!"}' $HOST/langfile/sample/en_gb 2>&1 > /dev/null
request -X GET $HOST/langfile/sample/en_gb
echo -en "\n"

request -X POST -d '{"general.fuck":"fuck!","general.no":"nein","general.ok":"ok","general.yes":"ja","general.yeah":"juhu!"}' $HOST/langfile/sample/de 2>&1 > /dev/null
request -X GET $HOST/langfile/sample/de
echo -en "\n"

request -X GET $HOST/langfile/sample/all
echo -en "\n"


exit $?
