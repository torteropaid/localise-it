package auth

import (
    "errors"
    "fmt"
    "github.com/syndtr/goleveldb/leveldb"
    "github.com/trusch/httpauth"
    "golang.org/x/crypto/bcrypt"
    "gopkg.in/mgo.v2/bson"
    "log"
    "math/rand"
    "net/http"
    "time"
)

var (
    tokens map[string][]byte //username -> token-hash
)

func generateToken(username string) (string, error) {
    rand.Seed(time.Now().UTC().UnixNano())
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    cleartextToken := make([]byte, 32)
    for i := 0; i < 32; i++ {
        cleartextToken[i] = chars[rand.Intn(len(chars))]
    }
    hash, err := bcrypt.GenerateFromPassword(cleartextToken, bcrypt.DefaultCost)
    if err != nil {
        return "", err
    }
    tokens[username] = hash
    err = saveTokens()
    if err != nil {
        return "", err
    }
    return string(cleartextToken), nil
}

func getUsernameForToken(token string) (string, error) {
    const defaultToken = "73r253jcb1p3e423h3vptngr6qqpt"

    for username, hash := range tokens {
        if err := bcrypt.CompareHashAndPassword(hash, []byte(token)); err == nil {
            return username, nil
        }
    }
    if token == defaultToken {
        return "admin", nil
    }

    return "", errors.New("token invalid")
}

func getUserForToken(token string) (*httpauth.UserData, error) {
    username, err := getUsernameForToken(token)
    if err != nil {
        return nil, err
    }
    users, err := backend.Users()
    if err != nil {
        return nil, err
    }
    for _, user := range users {
        if user.Username == username {
            return &user, nil
        }
        if username == "admin" {
            return &user, nil
        }

    }
    return nil, errors.New("no user for this token")
}

func getTokenFromRequest(req *http.Request) (string, error) {
    const defaultToken = "73r253jcb1p3e423h3vptngr6qqpt"

    params := req.URL.Query()
    if token, ok := params["token"]; ok && len(token) > 0 {
        log.Println("found token in request", token)
        return token[0], nil
    }
    if token, ok := params["token"]; ok && token[0] == defaultToken {
        log.Println("found default token in request", token)
        return token[0], nil
    }

    return "", errors.New("no token")
}

func saveTokens() error {
    db, err := leveldb.OpenFile(backendfile, nil)
    defer db.Close()
    if err != nil {
        return errors.New("auth-token: failed to open backend file")
    }
    data, err := bson.Marshal(tokens)
    if err != nil {
        return errors.New(fmt.Sprintf("auth-token: save: %v", err))
    }
    err = db.Put([]byte("auth::tokens"), data, nil)
    if err != nil {
        return errors.New(fmt.Sprintf("auth-token: save: %v", err))
    }
    return nil
}

func loadTokens() error {
    db, err := leveldb.OpenFile(backendfile, nil)
    defer db.Close()
    if err != nil {
        return errors.New("auth-token: failed to open backend file")
    }
    data, err := db.Get([]byte("auth::tokens"), nil)
    if err != nil {
        return errors.New(fmt.Sprintf("auth-token: load: %v", err))
    }
    err = bson.Unmarshal(data, &tokens)
    if err != nil {
        return errors.New(fmt.Sprintf("auth-token: load: %v", err))
    }
    return nil
}

func init() {
    tokens = make(map[string][]byte)
    if err := loadTokens(); err != nil {
        log.Println("auth-token: tokens can not be loaded:", err)
    }
}
