var rs = remoteStorage;//new RemoteStorage()

/////
// Displaying Credentials //
                      /////
function moveSelected(amount){
  var cur = $('#credentials_container .credential.selected');
  
  if(cur) {
    var list = toA( document.querySelectorAll( '#credentials_container .credential'));
    i = list.indexOf(cur);
    
    if (i>=0) {
      i+=amount;
      i = i < 0 ? 0 : 
        i > list.length-1 ? list.length-1 : i
      cur.classList.remove('selected');
      list[i].classList.add('selected');
    }
  
  } else {
    $('#credentials_container')
      .querySelector('.credential')
      .classList.add('selected');
  }
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

function renderCredential(platform, persona, name, entry) {
  //the .credential object
  var el = document.createElement('dl');
  el.className = 'credential';
  el.classList.add('box');
  el.classList.add('collapsed');    
  el.dataset.credential = JSON.stringify(entry);
  el.dataset.platform = platform;
  el.dataset.persona = persona;
  el.addEventListener('click', selectCredential)
  
  // file name
  var title = cEl('dt');
  title.textContent = name;
  title.classList.add('persona');
  el.appendChild(title);
  
  // collapse button
  var button = cEl('button');
  button.classList.add('button');
  button.textContent = '+';
  button.title = "<- / ->"
  var collapse = function(event) {
    event.cancelBubble = true;
    el.classList.add('collapsed')
    button.onclick = unfold;
    button.textContent = '+'
  };
  var unfold = function(event) {
    log('unfold')
    event.cancelBubble = true;
    el.classList.remove('collapsed');
    button.onclick = collapse;
    button.textContent = '-'
  };
  button.onclick =  unfold;
  el.appendChild(button);
  

  // content container
  var dl = cEl('dl')
  el.appendChild(cEl('dd').appendChild(dl))
  
  for(var k in entry) {
    if( k[0] == '@' )
      continue;
    var dt = document.createElement('dt');
    dt.textContent = k;
    dt.classList.add('key')
    var dd = document.createElement('dd');
    dd.classList.add('value')
    dd.textContent = entry[k];
    //store in the container
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  return el;
}

function showPersona(persona, container) {
  if( !container )
    container = $('#credentials_container');
  rs.credentials.getByPersona(persona).then(function(listing) {
    console.log('Persona Listing : ',listing);
    for(var platform in listing) {
      var entry = listing[platform];
      var el = renderCredential(platform, persona,  platform, entry );
      container.appendChild(el);
    }
  })
}

function showPlatform(platform, container) {
  if(! platform && 
     (options && options.platform) )
    platform = options.platform
  if(!platform)
    return;
  if(!container)
    container = $('#credentials_container')

  rs.credentials.getByPlatform(platform).then(function(listing) {
    console.log("found following entries ",listing);
    if(!listing) {
      var el = cEl('span');
      el.textContent = "No credentials for this platform !"
      el.classList.add('warning');
      container.appendChild(el);
    }
    for(var persona in listing) {
      var entry = listing[persona];
      var el = renderCredential(platform, persona, persona, entry);
      container.appendChild(el);
    }
  })
}

function keyBox(value, credentials_container) {
  var dl = cEl('dl')
      
  var dt = cEl('dt');
  dt.textContent = value;
  dt.classList.add('key');
  dl.appendChild(dt);
  
  var container = cEl('dd');
  dl.appendChild(container)
  credentials_container.appendChild(dl);
  return container;
}

function showAllPersonas(){
  var credentialsContainer = $('#credentials_container');
  rs.credentials.personas().then(function(personas) {
    personas.forEach(function(persona) {
      showPersona(persona, keyBox(persona, credentialsContainer));
    })
  })
}

function showAllPlatforms() {
  var credentialsContainer = $('#credentials_container');
  rs.credentials.platforms().then(function(platforms) {
    platforms.forEach(function(platform) {
      showPlatform(platform, keyBox(platform, credentialsContainer));
    })
  })
}

/////
// Verifier //
        /////

function getVerifier(){
  rs.credentials.verifier().then(function(img) {
    if(img) {
      $('#verifier').src = URL.createObjectURL(img);
    } else {
      console.error('no verifier found using stredukluky');
      $('#verifier').src = 'verifier.jpg'
    }
  })
}

function setVerifier(event){
  var img = $("#verifier_source").files[0];
  if(img)
    rs.credentials.setVerifier(img.slice()).then(getVerifier);
}



/////
// RemoteStorage //
             /////

function initRs(){
  rs.caching.disable('/');
  //rs.caching.enable('/credentials/.verifier');
  rs.caching.enable('/credentials/');
  rs.access.claim('credentials', 'rw');
  rs.credentials.on('need-key', function(cb){ // should be an callback thingie
    var div = $('#cypher');
    div.classList.remove('hidden');
    div.style.top = (window.innerHeight/2 - div.clientHeight).toFixed(0) + 'px';
    //div.style.right = (body.style.width/2 - div.clientWidth).toFixed(0) + 'px';
    console.log(div.style.top, div.style.left);
    div.querySelector('#key-button').onclick = function() {
      var input = div.querySelector('#key');
      cb(input.value);
      input.value = ''; // erasing value after using the widget
      div.classList.add('hidden');
    }
    
    console.log('needs key', arguments);
  })
  rs.displayWidget();
}

window.addEventListener('load', initRs);
