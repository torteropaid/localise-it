package data

import (
    "encoding/json"
    "errors"
    "log"
)

type LocaleSlice []string

func (p LocaleSlice) Contains(elem string) bool {
    for _, val := range p {
        if val == elem {
            return true
        }
    }
    return false
}

type Project struct {
    Pid           string                  `json:"pid"`
    DefaultLocale string                  `json:"defaultlocale"`
    Locales       LocaleSlice             `json:"locales"`
    Translations  map[string]*Translation `json:"translations"`
}

func (p *Project) load() error {
    key := "project::" + p.Pid
    data, err := db.Get([]byte(key), nil)
    if len(data) == 0 {
        return errors.New("no such project")
    }
    dataMap := make(map[string]interface{})
    err = json.Unmarshal(data, &dataMap)
    if err != nil {
        return err
    }
    p.Pid = dataMap["pid"].(string)
    p.DefaultLocale = dataMap["defaultlocale"].(string)
    p.Translations = make(map[string]*Translation)
    translationKeys := dataMap["translations"].([]interface{})
    for _, key := range translationKeys {
        dbKey := "translation::" + p.Pid + "::" + key.(string)
        data, err = db.Get([]byte(dbKey), nil)
        if err != nil {
            return err
        }
        t := &Translation{}
        err = json.Unmarshal(data, t)
        if err != nil {
            return err
        }
        p.updateLocalSlice(t)
        p.Translations[key.(string)] = t
    }
    return nil
}

func (p *Project) updateLocalSlice(t *Translation) {
    for locale, _ := range t.Mapping {
        if !p.Locales.Contains(locale) {
            p.Locales = append(p.Locales, locale)
        }
    }
}

func (p *Project) SetTranslation(key, locale, value string) error {
    if translation, ok := p.Translations[key]; ok {
        if translation.Mapping[p.DefaultLocale] != value {
            translation.Mapping[locale] = value
            err := translation.save()
            if err != nil {
                return err
            }
            if !p.Locales.Contains(locale) {
                p.Locales = append(p.Locales, locale)
                p.save()
            }
        } else {
            return errors.New("given value equals default translation")
        }
    } else {
        translation := &Translation{
            Pid: p.Pid,
            Key: key,
            Mapping: map[string]string{
                locale: value,
            },
        }
        err := translation.save()
        if err != nil {
            return err
        }
        p.Translations[key] = translation
        if !p.Locales.Contains(locale) {
            p.Locales = append(p.Locales, locale)
        }
        err = p.save()
        if err != nil {
            return err
        }
    }
    return nil
}

func (p *Project) RemoveTranslation(key, locale string) error {
    if translation, ok := p.Translations[key]; ok {
        delete(translation.Mapping, locale)
        if len(translation.Mapping) == 0 {
            translation.remove()
            delete(p.Translations, key)
        } else {
            translation.save()
        }
        locales := LocaleSlice{}
        for _, t := range p.Translations {
            for locale, _ := range t.Mapping {
                if !locales.Contains(locale) {
                    locales = append(locales, locale)
                }
            }
        }
        if len(p.Locales) != len(locales) {
            p.Locales = locales
            p.save()
        }
        return nil
    }
    return errors.New("no such translation key")
}

func (p *Project) GetLanguageFile(locale string) map[string]string {
    languageFile := make(map[string]string)
    for key, t := range p.Translations {
        if text, ok := t.Mapping[locale]; ok {
            languageFile[key] = text
        } else {
            languageFile[key] = t.Mapping[p.DefaultLocale]
        }
    }
    return languageFile
}

func (p *Project) ReadLanguageFile(locale string, data map[string]string) error {
    for key, text := range data {
        if t, ok := p.Translations[key]; ok {
            log.Printf("got translation for %v", key)
            if text != t.Mapping[p.DefaultLocale] {
                log.Printf("given translation differs from default locale: given: %v default: %v", text, t.Mapping[p.DefaultLocale])
                err := p.SetTranslation(key, locale, text)
                if err != nil {
                    return err
                }
            }
        } else if locale == p.DefaultLocale {
            err := p.SetTranslation(key, locale, text)
            if err != nil {
                return err
            }
        } else {
            log.Printf("user wants to add translation for locale %v with key %v but default translation doesn't exist", locale, key)
        }
    }
    return nil
}

func (p *Project) ToJSON() ([]byte, error) {
    dataMap := make(map[string]interface{})
    dataMap["pid"] = p.Pid
    dataMap["defaultlocale"] = p.DefaultLocale
    translationKeys := make([]string, 0, len(p.Translations))
    for key, _ := range p.Translations {
        translationKeys = append(translationKeys, key)
    }
    dataMap["translations"] = translationKeys
    return json.Marshal(dataMap)
}

func (p *Project) save() error {
    key := "project::" + p.Pid
    projectData, err := p.ToJSON()
    if err != nil {
        return err
    }
    err = db.Put([]byte(key), projectData, nil)
    if err != nil {
        return err
    }
    return nil
}

func (p *Project) remove() error {
    for _, t := range p.Translations {
        t.remove()
    }
    key := "project::" + p.Pid
    err := db.Delete([]byte(key), nil)
    if err != nil {
        return err
    }
    return nil
}
