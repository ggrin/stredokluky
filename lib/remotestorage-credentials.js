
RemoteStorage.defineModule('credentials', function(priv, pub){
  
  function Credentials() {

    RemoteStorage.eventHandling(this, 'need-key');

    this.decrypt = this.decrypt.bind(this);
    this.encrypt = this.encrypt.bind(this);
  }

  Credentials.prototype = {

    // Crypto Stuff

    secret: undefined,
    cryptoConfig: {ks: 256}, // FIXME this should probably be protected in some way

    _keyHandlers: [],
    getKeyCb: function(){
      console.error("no getKeyCb set");
    },
    getKey: function(doCrypt) {
      var promise = promising();
      this._keyHandlers.push(promise)
      var cb = function(key) {
        this.secret = key;
        this._keyHandlers.forEach(function(handler){
          handler.fulfill();
        })
      }.bind(this)
      this.getKeyCb(cb);
      return promise;
    },

    encrypt: function(data) {
      var promise = promising();
      if(!this.secret) {
        this.getKey().then(function() {
          this.encrypt(data).then(promise.fulfill,promise.reject)
        }.bind(this));
        return promise;
      }
      if(typeof data === 'object' && !(data instanceof String))
        data = JSON.stringify(data)
      try {
        var ret = sjcl.encrypt(this.secret, data, this.cryptoConfig);
        var ret = JSON.parse(ret);
      } catch(e) {
        return promise.reject(e)
      }
      return promise.fulfill(ret);
    },

    decrypt: function(container) {
      var promise = promising();
      if(!this.secret) {
        this.getKey().then(function() {
          this.decrypt(container).then(promise.fulfill,promise.reject);
        }.bind(this));
        return promise;
      }

      if(typeof container === 'object' && !(container instanceof String)) {  // enshure stringiness
        delete container['@context']
        container = JSON.stringify(container);
      }
      try {
        var ret = sjcl.decrypt(this.secret, container);
      } catch(e) {
        console.error('error decrypting', e, container);
        delete this.secret
        return promise.reject(e)
      }

      try {
        var ret = JSON.parse(ret); // is JSON ?
      } catch(e) {
        console.error('error parsing response', e, ret);
      }

      return promise.fulfill(ret);
    },

    // get
    credential: function(platform, persona) {
      if(platform.slice(-1) != '/') {
        platform+='/';
      }
      console.log(platform+persona)
      return priv.getObject(platform+persona).then(this.decrypt);
    },

    // Platform Getters

    platforms: function(){
      return priv.getListing('/').then(function(listing) {
        return listing.filter(function(item) { 
          return item.slice(-1) === '/'
        }).map(function(item) {
          return item.slice(0,-1)
        }).sort();
      })
    },

    getForPlatform: function(platform) {
      if(platform.slice(-1) != '/')
        platform += '/'
      return priv.getListing(platform);
    },
    getByPlatform : function(platform) {
      var promise = promising();
      var list = {}
      priv.getAll(platform+'/').then(function(items){
        if(!items) {
          return promise.reject();
        }
        var n = Object.keys(items).length+1;
        function oneDone() {
          n--;
          console.log(n,list);
          if (n == 0) {
            console.log('LIST',list);
            promise.fulfill(list)
          }
        }
        for (var item in items) {
          console.log('current item ',items[item]);
          this.decrypt(items[item]).then(function(data) {
            console.log('gat data ', data)
            list[item] = data;
            oneDone();
          },function(e){
            console.error('decrypting failed ',e)
            oneDone();
          })
        }
        oneDone();
      }.bind(this),promise.reject);
      return promise;
    },

    // Person getters

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

    getForPersona: function(person) {
      var promise = promising();
      var self = this;
      var list = [];
      var n;
      function oneDone() {
        n--;
        if(n == 0) {
          promise.fulfill(list);
        }
      }
      
      this.platforms().then( function(platforms) {
        n = platforms.length;
        platforms.forEach(function(platform) {
          self.getForPlatform(platform).then(function(listing) {
            for(var i = 0; i < listing.length; i++) {
              if(listing[i] == person) {
                list.push(platform);
                oneDone();
                return;
              }
            }
            oneDone();
            return;
          },promise.reject)
        })
      },promise.reject)
      return promise.then(undefined, function(e) {
        console.error("getForPersona failed : ",e,e.stack)
      });
    },

    getByPersona: function(query) {
      var promise = promising();
      var self = this;
      var list = {};
      var n = 0;
      function doneNow(){
        n--;
        if( n == 0) {
          console.log(' in get by Persona', list)
          promise.fulfill(list);
        }
      }

      priv.getListing('').then(function(dirs){
        n += dirs.length; //inc
        dirs.forEach(function(dir) {
          if(dir.slice(-1) === '/') {
            var scope = priv.scope(dir)
            scope.getListing('').then(function(files) {
              n += files.length //inc
              files.forEach(function(f) {
                if(f == query) {
                  n += 1; //inc
                  scope.getObject(f)
                    .then(self.decrypt)
                    .then(function(data) {
                      console.log('gat data ', data)
                      list[dir.slice(0,-1)] = data;
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
    
    // Write functions

    add: function(platform, persona, data) { 
      if(!platform || !persona)
        return promising().reject("no persona or platfrom")
      
      var path = platform + '/' + persona;
      return this.encrypt(data).then(function(container) {
        return priv.storeObject(undefined, path, container);
      })
    },

    remove: function(platform, persona) {
      if(!platform || !persona)
        return promising().reject("no persona or platfrom")
     
      return priv.remove(platform + '/' + persona);
    },

    // Verifier

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

  return {exports: new Credentials()}
})
