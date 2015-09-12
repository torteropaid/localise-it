package auth

import (
    "encoding/json"
    "flag"
    "fmt"
    "github.com/go-martini/martini"
    "github.com/syndtr/goleveldb/leveldb"
    "github.com/trusch/httpauth"
    "golang.org/x/crypto/bcrypt"
    "log"
    "net/http"
    "os"
)

var (
    backend         httpauth.LeveldbAuthBackend
    aaa             httpauth.Authorizer
    roles           map[string]httpauth.Role
    backendfile     = "passwords.leveldb"
    allowedProjects map[string]map[string]bool
)

func doLogin(rw http.ResponseWriter, req *http.Request) { // res and req are injected by Martini
    log.Println("login!")
    username := req.PostFormValue("username")
    password := req.PostFormValue("password")
    if err := aaa.Login(rw, req, username, password, "/"); err != nil && err.Error() == "already authenticated" {
        http.Redirect(rw, req, "/", http.StatusSeeOther)
    } else if err != nil {
        fmt.Println(err)
        rw.WriteHeader(http.StatusUnauthorized)
        rw.Write([]byte(err.Error()))
    }
}

func doLogout(rw http.ResponseWriter, req *http.Request) {
    log.Println("logout!")
    if err := aaa.Logout(rw, req); err != nil {
        fmt.Println(err)
        // this shouldn't happen
        return
    }
    http.Redirect(rw, req, "/", http.StatusSeeOther)
}

func doAddUser(rw http.ResponseWriter, req *http.Request) {
    username := req.PostFormValue("username")
    password := req.PostFormValue("password")
    role := req.PostFormValue("role")

    if username == "" || password == "" || role == "" {
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte("specify 'username' 'password' and 'role'"))
        return
    }

    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
        return
    }
    user := httpauth.UserData{Username: username, Email: "", Hash: hash, Role: role}
    err = backend.SaveUser(user)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Write([]byte("true"))
}

func doUpdateUser(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    username := params["username"]
    password := req.PostFormValue("password")
    role := req.PostFormValue("role")
    user, err := backend.User(username)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    if role != user.Role {
        user.Role = role
    }
    log.Println(user)
    if password != "" {
        log.Println("new password!")
        hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
        if err != nil {
            rw.WriteHeader(http.StatusInternalServerError)
            rw.Write([]byte(err.Error()))
            return
        }
        user.Hash = hash
    }
    log.Println(user)
    err = backend.SaveUser(user)
    if err != nil {
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Write([]byte("true"))
}

func doDeleteUser(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    username := params["username"]
    err := backend.DeleteUser(username)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Write([]byte("true"))
}

func doAllow(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    username := params["username"]
    project := req.PostFormValue("project")
    if projects, ok := allowedProjects[username]; ok {
        projects[project] = true
    } else {
        projects := make(map[string]bool)
        projects[project] = true
        allowedProjects[username] = projects
    }
    if err := saveAllowedProjects(); err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Write([]byte("true"))
}

func doForbid(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    username := params["username"]
    project := req.PostFormValue("project")
    if projects, ok := allowedProjects[username]; ok {
        delete(projects, project)
    }
    if err := saveAllowedProjects(); err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Write([]byte("true"))
}

func doGetUsers(rw http.ResponseWriter, req *http.Request) {
    users, err := backend.Users()
    res := make(map[string]map[string]interface{})
    for _, user := range users {
        userData := make(map[string]interface{})
        userData["name"] = user.Username
        userData["role"] = user.Role
        projects := make([]string, 0, len(allowedProjects[user.Username]))
        for project, allowed := range allowedProjects[user.Username] {
            if allowed {
                projects = append(projects, project)
            }
        }
        userData["projects"] = projects
        res[user.Username] = userData
    }
    encoder := json.NewEncoder(rw)
    err = encoder.Encode(res)
    if err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
    }
}

func doGetUser(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    username := params["username"]
    users, err := backend.Users()
    res := make(map[string]interface{})
    for _, user := range users {
        if user.Username == username {
            res["name"] = user.Username
            res["role"] = user.Role
            projects := make([]string, 0, len(allowedProjects[user.Username]))
            for project, allowed := range allowedProjects[user.Username] {
                if allowed {
                    projects = append(projects, project)
                }
            }
            res["projects"] = projects
        }
    }
    encoder := json.NewEncoder(rw)
    err = encoder.Encode(res)
    if err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
    }
}

func doGetCurrentUser(rw http.ResponseWriter, req *http.Request) {
    var user httpauth.UserData
    if token, err := getTokenFromRequest(req); err == nil {
        user_, err := getUserForToken(token)
        if err != nil {
            fmt.Println(err)
            rw.WriteHeader(http.StatusUnauthorized)
            rw.Write([]byte(err.Error()))
            return
        }
        user = *user_
    } else if user, err = aaa.CurrentUser(rw, req); err != nil {
        fmt.Println(err)
        rw.WriteHeader(http.StatusUnauthorized)
        rw.Write([]byte(err.Error()))
        return
    }
    res := make(map[string]interface{})
    res["name"] = user.Username
    res["role"] = user.Role
    projects := make([]string, 0, len(allowedProjects[user.Username]))
    for project, allowed := range allowedProjects[user.Username] {
        if allowed {
            projects = append(projects, project)
        }
    }
    res["projects"] = projects
    encoder := json.NewEncoder(rw)
    err := encoder.Encode(res)
    if err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
    }
}

func doGetToken(rw http.ResponseWriter, req *http.Request) {
    user, err := aaa.CurrentUser(rw, req)
    if err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusUnauthorized)
        rw.Write([]byte(err.Error()))
        return
    }
    token, err := generateToken(user.Username)
    if err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
        return
    }
    res := map[string]string{"token": token}
    encoder := json.NewEncoder(rw)
    err = encoder.Encode(res)
    if err != nil {
        log.Println(err)
        rw.WriteHeader(http.StatusInternalServerError)
        rw.Write([]byte(err.Error()))
    }
}

func saveAllowedProjects() error {
    db, err := leveldb.OpenFile(backendfile, nil)
    defer db.Close()
    if err != nil {
        return err
    }
    data, err := json.Marshal(allowedProjects)
    if err != nil {
        return err
    }
    return db.Put([]byte("auth::projects"), data, nil)
}

func loadAllowedProjects() error {
    db, err := leveldb.OpenFile(backendfile, nil)
    defer db.Close()
    if err != nil {
        return err
    }
    data, err := db.Get([]byte("auth::projects"), nil)
    if err != nil {
        return err
    }
    return json.Unmarshal(data, &allowedProjects)
}

func SetupAuth(martini *martini.ClassicMartini) {
    os.Mkdir(backendfile, 0755)
    backend_, err := httpauth.NewLeveldbAuthBackend(backendfile)
    if err != nil {
        log.Fatal(err.Error())
    }
    backend = backend_

    roles = make(map[string]httpauth.Role)
    roles["user"] = 30
    roles["admin"] = 80

    aaa, err = httpauth.NewAuthorizer(backend, []byte("cookie-encryption-key"), "user", roles)
    if err != nil {
        log.Fatal(err.Error())
    }

    users, err := backend.Users()
    if err != nil || len(users) == 0 {
        // create a default user
        hash, err := bcrypt.GenerateFromPassword([]byte("toor"), bcrypt.DefaultCost)
        if err != nil {
            panic(err)
        }
        defaultUser := httpauth.UserData{Username: "root", Email: "", Hash: hash, Role: "admin"}
        err = backend.SaveUser(defaultUser)
        if err != nil {
            panic(err)
        }
    }

    martini.Post("/auth/login", doLogin)
    martini.Get("/auth/logout", doLogout)
    martini.Get("/auth/token", doGetToken)

    martini.Post("/auth/user", AssertRole("admin"), doAddUser)

    martini.Get("/auth/currentuser", doGetCurrentUser)
    martini.Get("/auth/user", AssertRole("admin"), doGetUsers)
    martini.Get("/auth/user/:username", AssertRole("admin"), doGetUser)

    martini.Put("/auth/user/:username", AssertRole("admin"), doUpdateUser)
    martini.Delete("/auth/user/:username", AssertRole("admin"), doDeleteUser)
    martini.Post("/auth/user/:username/allow", AssertRole("admin"), doAllow)
    martini.Post("/auth/user/:username/forbid", AssertRole("admin"), doForbid)

}

func AssertRole(role string) func(rw http.ResponseWriter, req *http.Request) {
    return func(rw http.ResponseWriter, req *http.Request) {
        if token, err := getTokenFromRequest(req); err == nil {
            user, err := getUserForToken(token)
            if err != nil {
                fmt.Println(err)
                rw.WriteHeader(http.StatusUnauthorized)
                rw.Write([]byte(err.Error()))
                return
            }
            if user.Role != role {
                rw.WriteHeader(http.StatusUnauthorized)
                return
            } else {
                return
            }
        }
        if err := aaa.Authorize(rw, req, true); err != nil {
            fmt.Println(err)
            rw.WriteHeader(http.StatusUnauthorized)
            return
        } else {
            if user, err := aaa.CurrentUser(rw, req); err == nil {
                if user.Role != role {
                    rw.WriteHeader(http.StatusUnauthorized)
                }
            }
        }
    }
}

func IsAllowed(rw http.ResponseWriter, req *http.Request, project string) bool {
    var user *httpauth.UserData = nil

    if token, err := getTokenFromRequest(req); err == nil {
        user, err = getUserForToken(token)
        if err != nil {
            fmt.Println(err)
            return false
        }
    } else {
        user_, err := aaa.CurrentUser(rw, req)
        if err != nil {
            fmt.Println(err)
            return false
        }
        user = &user_
    }

    if user.Role == "admin" {
        return true
    }
    projects := allowedProjects[user.Username]
    if allowed, ok := projects[project]; ok {
        return allowed
    } else {
        return false
    }
    return false
}

var passwordDB = flag.String("password-db", "./passwords.leveldb", "specify the password database path")

func Init() {
    backendfile = *passwordDB
    if err := loadAllowedProjects(); err != nil {
        allowedProjects = make(map[string]map[string]bool)
    }
}
