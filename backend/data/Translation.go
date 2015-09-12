package data

import (
    "encoding/json"
    "fmt"
)

type Translation struct {
    Pid string `json:"-"`
    Key string `json:"-"`
    Mapping map[string]string `json:"mapping"`
}

func (t *Translation) toJSON() ([]byte,error){
    return json.Marshal(t)
}

func (t *Translation) save() error {
    key := "translation::"+t.Pid+"::"+t.Key
    translationData, err := t.toJSON()
    if err!=nil {
        return err
    }
    err = db.Put([]byte(key),translationData,nil)
    if err!=nil {
        return err
    }
    return nil
}

func (t *Translation) remove() error {
    key := "translation::"+t.Pid+"::"+t.Key
    err := db.Delete([]byte(key),nil)
    if err!=nil {
        return err
    }
    return nil
}
func (t *Translation) String() string {
    return fmt.Sprintf("%v",*t)
}