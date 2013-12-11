RemoteStorage.defineModule('credentials', function(priv, pub){
  exports = {
    platforms: function(){
      return priv.getListing('/').then(function(listing) {
        return listing.filter(function(item) { 
          return item.slice(-1) === '/'
        }).map(function(item) {
          return item.slice(0,-1)
        }).sort();
      })
    },

    getByPlatform : function(platform) {
      return priv.getAll(platform+'/');
    },

    personas: function() {
      var promise = promising();
      var list = [];
      var n = 0;
      function oneDone() {
        n-=1;
        if (n <= 0) {
          list = list.sort();
          promise.fulfill(list)
        }
      }
      priv.getListing('/').then(function(listing) {
        listing.forEach(function(platform) {
          if (platform.slice(-1) !== '/')
            return;
          n += 1;
          priv.getListing(platform).then(function(personas) {
            n+=1;
            personas.forEach(function(persona) {
              if (list.indexOf(persona) < 0) {
                list.push(persona);
              }
            })
            oneDone();
          }).then(oneDone);
        })
      }, function(e) {promise.reject("listing personas failed " + e.mesage + e.stack());})
      return promise;
    },

    getByPersona : function(query) {
      console.log('getByPersona :', query);
      var promise = promising();
      var list = {};
      var n = 0;
      function doneNow(){
        n--;
        if( n == 0) {
          promise.fulfill(list);
        }
      }

      priv.getListing('/').then(function(dirs){
        n += dirs.length; //inc
        dirs.forEach(function(dir) {
          if(dir.slice(-1) === '/') {
            var scope = priv.scope(dir)
            console.log(dir);
            scope.getListing('').then(function(files) {
              n += files.length //inc
              files.forEach(function(f) {
                if(f == query) {
                  n += 1; //inc
                  scope.getObject(f).then(function(object) {
                    list[dir.slice(0,-1)] = object;
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
    },

    add: function(platform, persona, data) { 
      if(!platform || !persona)
        return promising().reject("no persona or platfrom")
      
      var path = platform + '/' + persona;
      return priv.storeObject(undefined, path, data);
    },

    remove: function(platform, persona) {
      if(!platform || !persona)
        return promising().reject("no persona or platfrom")
     
      return priv.remove(platform + '/' + persona);
    },

    verifier: function() {
      return priv.getFile('.verifier').then(function(obj) {
        console.log(obj)
        if(obj.data)
          return new Blob([obj.data], {type : obj.mimeType} );
      });
    },

    setVerifier: function(img, mimeType) {
      var promise = promising();
      var fileReader = new FileReader();
      
      if(!mimeType) mimeType = 'image/jpeg';

      fileReader.onload = function(){
        priv.storeFile( mimeType, '.verifier', fileReader.result).then(promise.fulfill, promise.reject);
      }
      fileReader.onerror = function(){
        promise.reject(filereader.error);
      }
      fileReader.readAsArrayBuffer(img);
      return promise;
    }
  }
  return {exports: exports}
})
