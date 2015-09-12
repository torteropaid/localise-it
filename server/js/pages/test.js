restless.Page('^/test$', ()=>{
    
    return {
        body: `
Url: ${URL}
Method: ${METHOD}
Headers: ${JSON.stringify(HEADERS)}
User: ${USERNAME}
Role: ${ROLE}
Body: ${BODY}

`
    }
})
