package main

import (
    "encoding/json"
    "flag"
    "github.com/go-martini/martini"
    "io/ioutil"
    "log"
    "net/http"

    "./auth"
    "./data"
)

/**
 * GET /api/:project
 * Get all data for one project
 */
func GetProject(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    p, err := data.GetProject(project)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    enc := json.NewEncoder(rw)
    rw.Header().Add("Content-Type", "application/json")
    enc.Encode(p)
}

/**
 * PUT /api/:project
 * Create a new project, or reset it (DANGER: removes all project keys)
 */
func PutProject(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    data.RemoveProject(project)
    _, err := data.CreateProject(project)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Header().Add("Content-Type", "application/json")
    rw.Write([]byte("true"))
}

/**
 * DELETE /api/:project
 * delete a project and all associated language keys
 */
func DeleteProject(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    err := data.RemoveProject(project)
    if err != nil {
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Header().Add("Content-Type", "application/json")
    rw.Write([]byte("true"))
}

/**
 * GET /api/:project/:key
 * get all translations for this key
 */
func GetTranslation(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    key := params["key"]
    p, err := data.GetProject(project)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    if t, ok := p.Translations[key]; ok {
        res := make(map[string]string)
        for key, val := range t.Mapping {
            res[key] = val
        }
        enc := json.NewEncoder(rw)
        rw.Header().Add("Content-Type", "application/json")
        enc.Encode(res)
    } else {
        rw.WriteHeader(404)
        rw.Write([]byte("no such translation"))
    }
}

/**
 * PUT /api/:project/translation/:key/:locale
 * set/update a locale to a key
 */
func PutLocale(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    key := params["key"]
    locale := params["locale"]
    log.Printf("got put locale: %v %v %v", project, key, locale)
    p, err := data.GetProject(project)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    data, err := ioutil.ReadAll(req.Body)
    if err != nil {
        rw.WriteHeader(500)
        rw.Write([]byte(err.Error()))
        return
    }
    err = p.SetTranslation(key, locale, string(data))
    if err != nil {
        rw.WriteHeader(500)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Header().Add("Content-Type", "application/json")
    rw.Write([]byte("true"))
}

/**
 * DELETE /api/:project/translation/:key/:locale
 * delete a specific locale from a key
 */
func DeleteLocale(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    key := params["key"]
    locale := params["locale"]
    log.Printf("got put locale: %v %v %v", project, key, locale)
    p, err := data.GetProject(project)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    err = p.RemoveTranslation(key, locale)
    if err != nil {
        rw.WriteHeader(500)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Header().Add("Content-Type", "application/json")
    rw.Write([]byte("true"))
}

/**
 * GET /api/:project/file/:locale
 * get a language file in a specific locale
 */
func GetLanguageFile(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    locale := params["locale"]
    p, err := data.GetProject(project)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    file := p.GetLanguageFile(locale)
    enc := json.NewEncoder(rw)
    rw.Header().Add("Content-Type", "application/json")
    enc.Encode(file)
}

/**
 * PUT /api/:project/file/:locale
 * upload a languagefile and merge the changes into db
 */
func PutLanguageFile(rw http.ResponseWriter, req *http.Request, params martini.Params) {
    project := params["project"]
    if !auth.IsAllowed(rw, req, project) {
        rw.WriteHeader(http.StatusUnauthorized)
        return
    }
    locale := params["locale"]
    p, err := data.GetProject(project)
    if err != nil {
        rw.WriteHeader(404)
        rw.Write([]byte(err.Error()))
        return
    }
    decoder := json.NewDecoder(req.Body)
    dataMap := make(map[string]string)
    err = decoder.Decode(&dataMap)
    if err != nil {
        rw.WriteHeader(500)
        rw.Write([]byte(err.Error()))
        return
    }
    err = p.ReadLanguageFile(locale, dataMap)
    if err != nil {
        rw.WriteHeader(500)
        rw.Write([]byte(err.Error()))
        return
    }
    rw.Header().Add("Content-Type", "application/json")
    rw.Write([]byte("true"))
}

func RedirectToIndex(rw http.ResponseWriter, req *http.Request) {
    http.Redirect(rw, req, "/assets/index.html", 301)
}

/**
 * attach all api endpoints
 */
func SetupApiEndpoints(m *martini.ClassicMartini) {
    m.Get("/api/:project", GetProject)
    m.Put("/api/:project", PutProject)
    m.Delete("/api/:project", DeleteProject)
    m.Get("/api/:project/translation/:key", GetTranslation)
    m.Put("/api/:project/translation/:key/:locale", PutLocale)
    m.Delete("/api/:project/translation/:key/:locale", DeleteLocale)
    m.Get("/api/:project/file/:locale", GetLanguageFile)
    m.Put("/api/:project/file/:locale", PutLanguageFile)
}

var httpAddr = flag.String("http-addr", ":8080", "http server address and port")
var httpsAddr = flag.String("https-addr", ":8443", "https server address and port")
var cert = flag.String("cert", "cert.pem", "https certificate")
var key = flag.String("key", "key.pem", "https key")

var assets = flag.String("assets", "./assets", "asset directory")
var develop = flag.Bool("dev", false, "development mode")

func main() {
    /**
     * Init packages with flags parsed by main
     */
    flag.Parse()
    if *develop {
        martini.Env = martini.Dev
    } else {
        martini.Env = martini.Prod
    }
    data.Init()
    auth.Init()

    /**
     * create martini server
     *     - create
     *     - attach auth endpoints
     *     - attach api endpoints
     *     - setup asset handler
     */
    m := martini.Classic()
    auth.SetupAuth(m)
    SetupApiEndpoints(m)
    m.Get("/assets/**", http.StripPrefix("/assets/", http.FileServer(http.Dir(*assets))))
    m.Get("/", RedirectToIndex)

    /**
     * Run forever
     */
    if *httpAddr != "" {
        // HTTP
        go func() {
            if err := http.ListenAndServe(*httpAddr, m); err != nil {
                log.Fatal(err)
            }
        }()
    }
    if *httpsAddr != "" && *cert != "" && *key != "" {
        // HTTPS
        // To generate a development cert and key, run the following from your *nix terminal:
        // go run $GOROOT/src/pkg/crypto/tls/generate_cert.go --host="localhost"
        go func() {
            if err := http.ListenAndServeTLS(*httpsAddr, *cert, *key, m); err != nil {
                log.Fatal(err)
            }
        }()
    }

    select {}
}
