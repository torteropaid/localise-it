package data

import (
    "github.com/syndtr/goleveldb/leveldb"
    "errors"
    "flag"
)

var translationDB = flag.String("translation-db","./translation.leveldb","specify the translation database path")

var (
    leveldbPath = "./translations.leveldb"
    projects = map[string]*Project{}
    db *leveldb.DB
)

func Init(){
    leveldbPath = *translationDB
    db_,err := leveldb.OpenFile(leveldbPath,nil)
    if err!=nil {
        panic(err)
    }
    db = db_
}

func GetProject(id string) (*Project,error) {
    if p,ok := projects[id]; ok {
        return p,nil
    }
    p :=  &Project{
        Pid: id,
    }
    err := p.load()
    if err!=nil {
        return nil,err
    }
    projects[id] = p
    return p,nil
}

func CreateProject(id string) (*Project,error) {
    p :=  &Project{
        Pid: id,
        DefaultLocale: "en_gb",
        Translations: make(map[string]*Translation),
    }
    err := p.save()
    if err!=nil {
        return nil,err
    }
    projects[id] = p
    return p,nil
}

func RemoveProject(id string) error {
    if p,ok := projects[id]; ok {
        delete(projects,id)
        p.remove()
        return nil
    }
    return errors.New("no such project")
}