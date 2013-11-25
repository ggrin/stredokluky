RemoteStorage.defineModule('credentials', function(priv, pub){
  exports = {
    getByPlatform : function(platform) {
      return priv.getAll(platform+'/');
    }
  }
  return {exports: exports}
})
