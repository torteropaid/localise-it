language_portal: **/*.go
	go build -o language_portal

clean:
	rm -rf language_portal
	rm -rf translation.leveldb
	rm -rf passwords.leveldb
	rm -rf cert.pem
	rm -rf key.pem

key.pem:
	go run /usr/share/go/src/pkg/crypto/tls/generate_cert.go --host="localhost"

cert.pem:
	go run /usr/share/go/src/pkg/crypto/tls/generate_cert.go --host="localhost"

run: language_portal key.pem cert.pem
	./language_portal
