var rs;
var options;

function queryString(str){
  return str.slice(1).split('&').reduce( 
    function(m, el){ 
      var set = el.split('=');
      if(set[0])
        m[decodeURIComponent(set[0])]=decodeURIComponent(set[1]); 
      return m  
    }, {});
}

$ = document.querySelector.bind(document);

function setDataset(el, data) {
  for (var k in data) {
    if(k[0] == '@')
      continue;
    el.dataset[k] = data[k]
  }
}

function go() {
  var url = options.redirect_to;
  url+='#'+encodeURIComponent(
    JSON.stringify(
      $('#credentials_container .credential.selected').dataset
    ))
  document.location =  url ;
}

function init() {
  options =  queryString(location.search);
  if(options.redirect_to) {
    $('#redirect_uri').textContent = options.redirect_to;
  }
  if(options.platform) {
    
  } else {
    options.platform = '*';
  }

  $('#go').addEventListener('click', go);
  return ':)';
}

function initRs(){
  rs = new RemoteStorage()
  //rs.caching.disable('/');
  rs.access.claim('credentials', 'r');
  rs.displayWidget();
  rs.on('ready', showAvailable);
}

function selectCredential(event) {
  var el = event.target
  while( !el.classList.contains('credential') ) {
    el = el.parentElement;
  }
  el.classList.add('selected')
}

function showAvailable() {
  if(!( options && options.platform && options.pltform != '*'))
    return;
  var template = $('#credential_template');
  var container = $('#credentials_container')
  rs.credentials.getByPlatform(options.platform).then(function(listing) {
    if(!listing) //empty directory
      return;
    for(var name in listing) {
      var entry = listing[name];
      var dl = document.createElement('dl');
      dl.className = 'credential';
      setDataset(dl, entry);
      dl.addEventListener('click', selectCredential)
      var title = document.createElement('dt');
      title.textContent = name
      dl.appendChild(title);
      
      for(var k in entry) {
        if( k[0] == '@' )
          continue;
        var dt = document.createElement('dt');
        dt.textContent = k;
        var dd = document.createElement('dd');
        dd.textContent = entry[k];
        
        dl.appendChild(dt);
        dl.appendChild(dd);
      }
      container.appendChild(dl);
    }
  })
} 

window.addEventListener('load', init);
window.addEventListener('load', initRs);
