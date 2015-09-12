/**
 * Apple Model: A simple model example
 */
restless.Model('Translation', class {
  
  onPreGet(){
    if(ROLE !== 'admin') throw 'no right!';
  }

  onPreRemove(){
    if(ROLE !== 'admin') throw 'no right!';
    let project = restless.CreateModel('Project')
    project.getFromUID(this.get('pid'))
    let translationKeys = project.get('keys')
    for(let i=0; i< translationKeys.length; i++){
      if(translationKeys[i] === this.__uid){
        console.debug(`deleted key ${this.__uid} from project ${project.__uid}`)
        translationKeys.splice(i,1)
        project.put()
        break;
      }
    }
  }
  onPostRemove(){
    console.debug(`deleted translation ${this.__uid} of project ${this.get('pid')}`);
  }

  onPrePut(){
    if(ROLE !== 'admin') throw 'no right!';
  }
  onPostPut(){
    let project = restless.CreateModel('Project')
    project.getFromUID(this.get('pid'))
    let translationKeys = project.get('keys')
    if(! contains(translationKeys,this.__uid)){
      translationKeys.push(this.__uid);
      project.put()
      console.debug(`added key ${this.__uid} to project ${project.__uid}`)
    }
    console.debug(`updated translation ${this.__uid} of project ${this.get('pid')}`);
  }

});

function contains(arr,elem){
  for(var i=0;i<arr.length;i++){
    if(arr[i]===elem){
      return true;
    }
  }
  return false;
}
