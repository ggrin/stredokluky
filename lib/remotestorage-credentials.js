RemoteStorage.defineModule('credentials', function(priv, pub){
  exports = {
    getByPlatform : function(platform) {
      return priv.getAll(platform+'/');
    },
    getByPersona : function(query) {
      var promise = promising();
      var list = [];
      n = 0;
      function doneNow(){
        n--;
        if( n == 0) {
          promise.fulfill(list);
        }
      }

      priv.getListing('/').then(function(dirs){
        n += dirs.length; //inc
        dirs.forEach(function(dir) {
          if(dir.slice(-1) == '/') {
            var scope = priv.scope(dir)
            scope.getListing('/').then(function(files) {
              n += files.length //inc
              files.forEach(function(f) {
                if(f == query) {
                  n += 1; //inc
                  scope.getObject(f).then(function(object) {
                    list.push(object);
                    doneNow(); //dec
                  })
                }
                doneNow(); //dec
              })
              doneNow(); //dec
            })
          }  else {
            doneNow(); //dec
          }
        })
      }).then(undefined, promise.reject);

      return promise;
    }
  }
  return {exports: exports}
})
