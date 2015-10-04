localise_it: **/*.go
	go build -o localise_it

clean:
	rm -rf localise_it
	rm -rf translation.leveldb
	rm -rf passwords.leveldb
	rm -rf cert.pem
	rm -rf key.pem

key.pem:
	go run /usr/share/go/src/pkg/crypto/tls/generate_cert.go --host="localhost"

cert.pem:
	go run /usr/share/go/src/pkg/crypto/tls/generate_cert.go --host="localhost"

run: localise_it key.pem cert.pem
	./localise_it
