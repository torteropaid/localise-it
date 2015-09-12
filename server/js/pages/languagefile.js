restless.Page('^/langfile', () => {
    let parts = URL.split('/')
    if (parts.length < 3) {
        throw 'call this url with /langfile/<projectid>/<locale>'
    }
    if (METHOD === 'GET') {
        let langFile = new LanguageFile(parts[2], parts[3])
        return {
            status: 200,
            header: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(langFile.getData())
        }
    } else if (METHOD === 'POST') {
        let langFile = new LanguageFile(parts[2], parts[3])
        return {
            status: 200,
            header: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(langFile.setData(JSON.parse(BODY)))
        }
    } else {
        return {
            status: 404,
            body: 'not an implemented http verb: ' + METHOD
        }
    }
});


var timesaver = {
    dirty: true
}

class LanguageFile {
    constructor(projectid, locale) {
        this.defaultLocale = 'en_gb'
        this.locale = locale
        if (timesaver.dirty) {
            this.project = restless.CreateModel('Project')
            this.project.getFromUID(projectid)
            console.debug(`got project ${this.project.__uid}`)
            let translationKeys = this.project.get('keys')
            console.debug(`got ${translationKeys.length} projectkeys`)
            this.translations = {}
            for (var i = translationKeys.length - 1; i >= 0; i--) {
                let t = restless.CreateModel('Translation')
                t.getFromUID(translationKeys[i])
                this.translations[t.get('key')] = t
                console.debug(`loaded translation: ${t.__uid}`)
            }
            timesaver.project = this.project
            timesaver.translations = this.translations
            timesaver.dirty = false
        } else {
            this.project = timesaver.project
            this.translations = timesaver.translations
        }
    }

    getData() {
        var result = {}
        let translationKeys = Object.keys(this.translations)
        console.debug(`got ${translationKeys.length} keys`)
        for (var i = translationKeys.length - 1; i >= 0; i--) {
            let key = translationKeys[i]
            let translation = this.translations[key]
            if (this.locale === 'all') {
                result[translation.get('key')] = translation.get('translations')
                result[translation.get('key')].__internalKey = translation.get('__internalKey')
            } else if (translation.get('translations.' + this.locale) !== undefined) {
                result[translation.get('key')] = translation.get('translations.' + this.locale);
            } else {
                result[translation.get('key')] = translation.get('translations.' + this.defaultLocale);
            }
        }
        return result
    }

    setData(data) {
        let count = 0
        let max = Object.keys(data).length
        for (let key in data) {
            let myTranslation = this.translations[key]
            if (myTranslation === undefined && this.locale === this.defaultLocale) { // we have no local definition for this key
                let translation = restless.CreateModel("Translation")
                translation.initFromData({
                    pid: this.project.__uid,
                    key: key
                })
                translation.set('translations.' + this.locale, data[key])
                translation.set('__internalKey', translation.__uid)
                translation.put()
                timesaver.project.__data.keys.push(translation.__uid)
                timesaver.translations[key] = translation
                this.translations[key] = translation
            } else if (myTranslation !== undefined) {
                let myStr = myTranslation.get('translations.' + this.locale)
                let myDefault = myTranslation.get('translations.' + this.defaultLocale)
                if (myStr === undefined) {
                    if (myDefault !== data[key]) {
                        console.debug(`translation differs from default translation: ${data[key]} <!> ${myDefault}`)
                        myTranslation.set('translations.' + this.locale, data[key])
                        myTranslation.put()
                        timesaver.translations[key] = myTranslation
                    }
                } else if (myStr !== data[key]) {
                    myTranslation.set('translations.' + this.locale, data[key])
                    myTranslation.put()
                    timesaver.translations[key] = myTranslation
                }
            }
            count++
            console.debug(`imported ${count} / ${max}\t(${((1.0)*count)/((1.0)*max)*100.}%)`)
        }
        return true
    }
}