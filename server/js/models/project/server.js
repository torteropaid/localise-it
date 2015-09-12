/**
 * Apple Model: A simple model example
 */
restless.Model('Project', class {
  
  onPreGet(){
    if(ROLE !== 'admin') throw 'no right!';
  }
  onPostGet(){
    //this.set('example.dynamic.requestTime',(new Date()).toString());
  }

  onPreRemove(){
    if(ROLE !== 'admin') throw 'no right!';
    let translationKeys = this.get('keys')
    for(let i=0;i<translationKeys.length;i++){
      let translation = restless.CreateModel("Translation")
      translation.getFromUID(translationKeys[i])
      translation.remove()
    }
  }
  onPostRemove(){
    console.debug(`deleted project ${this.__uid}`);
  }

  onPrePut(){
    if(ROLE !== 'admin') throw 'no right!';
    if(this.get('keys') === undefined){
      this.set('keys',[])
    }
  }
  onPostPut(){
    console.debug(`updated project ${this.__uid}`);
  }
  
  
});

