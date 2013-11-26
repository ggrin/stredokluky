var rs = new RemoteStorage()
var options;

function go() {
  var url = options.redirect_to;
  url+='#'+options.platform+'='+encodeURIComponent(
    JSON.stringify(
      $('#credentials_container .credential.selected').dataset
    ))
  document.location =  url ;
}

function init() {
  options =  queryString(location.search);
  if(options.redirect_to) {
    $('#redirect_to').textContent = options.redirect_to;
    $('#platform').textContent = options.platform;
  }
  if(options.platform) {
    rs.on('ready', showAvailable);
  } else {
    options.platform = '*';
  }

  $('#go').addEventListener('click', go);
  return ':)';
}

function initRs(){
  //rs.caching.disable('/');
  rs.access.claim('credentials', 'r');
  rs.displayWidget();
}

function selectCredential(event) {
  var el = event.target
  //find actual credential
  while( !el.classList.contains('credential') ) {
    el = el.parentElement;
  }
  //select and deselect old one
  var oldOne = $('.credential.selected');
  oldOne && oldOne.classList.remove('selected');
  el.classList.add('selected');
}

function renderCredential(name, entry) {
  //the .credential object
  var el = document.createElement('dl');
  el.className = 'credential';
  setDataset(el, entry);
  el.addEventListener('click', selectCredential)

  //file name
  var title = document.createElement('dt');
  title.textContent = name
  el.appendChild(title);
  //content container
  var dl = cEl('dl')
  el.appendChild(cEl('dd').appendChild(dl))
  
  for(var k in entry) {
    if( k[0] == '@' )
      continue;
    var dt = document.createElement('dt');
    dt.textContent = k;
    var dd = document.createElement('dd');
    dd.textContent = entry[k];
    //store in the container
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
  return el;
}

function showAvailable() {
  if(!( options && options.platform && options.pltform != '*'))
    return;
  var container = $('#credentials_container')
  rs.credentials.getByPlatform(options.platform).then(function(listing) {
    if(!listing) {
      var el = cEl('span');
      el.textContent = "No credentials for this platform !"
      el.classList.add('warning');
      container.appendChild(el);
    }
    for(var name in listing) {
      var entry = listing[name];
      var el = renderCredential(name, entry);
      el.classList.add('box');
      container.appendChild(el);
    }
  })
} 

window.addEventListener('load', init);
window.addEventListener('load', initRs);
