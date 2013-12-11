var rs = remoteStorage;//new RemoteStorage()
var options;

/////
// Buttons //
       /////

function go() {
  var url = options.redirect_to;
  url+='#credential='+encodeURIComponent($('#credentials_container .credential.selected').dataset.credential)
  document.location =  url ;
}

function add() {
  $('#credentials_container').style.display = 'none';
  var addContainer = $('#add_container')
  addContainer.style.display = 'block';
  addContainer.querySelector('input').focus();
}

function listView(render) {
  $('#credentials_container').style.display = 'block';
  $('#add_container').style.display = 'none';
  if (render) showCredentials();
}

function del() {
  var item = $('#credentials_container .credential.selected');
  if(!item)
    return
  var data = item.dataset;
  if (! confirm('Do you realy want to delete this\n' + 
          'persona\t: ' + data.persona + '\nplatform\t: ' + data.platform))
    return;
  rs.credentials.remove(data.platform, data.persona).then(function(status) {
    if(status < 200 && status > 300)
      throw status;
    if(item.parentElement.previousElementSibling.classList.contains('key') && item.parentElement.children.length == 1 ) {
      item.parentElement.previousSibling.remove();
      item.parentElement.remove();
    } else {
      item.remove();
    }
  } );
}


function showCredentials() {
  $('#credentials_container').innerHTML = '';
  if (options.show == 'persona')
    showAllPersonas();
  else if (options.show == 'platform')
    showAllPlatforms();
  else if (options.platform)
    showPlatform(options.platform);
  else if (options.persona)
    showPersona(options.persona);
  else
    showAllPlatforms();
}

function init() {

  /////
  // options //
         /////
  options =  queryString(location.search);
  if (options.redirect_to) {
    $('#redirect_to').textContent = options.redirect_to;
    $('#platform').textContent = options.platform;
  }
  
  remoteStorage.on('ready', showCredentials);

  /////
  // verifier img //
              /////
  rs.on('ready', getVerifier);
  $('#verifier').addEventListener('click', function(event){
    $('#verifier_source').click(event);
  });
   $('#verifier_source').addEventListener('change', setVerifier)

  /////
  // toolbox ///
          /////
   $('#go').addEventListener('click', go);
  $('#add').addEventListener('click', add);
  $('#del').addEventListener('click', del);

  $('#list-platforms').addEventListener('click', function(){
    options.show = 'platform';
    showCredentials();
  });
  $('#list-personas').addEventListener('click', function(){
    options.show = 'persona';
    showCredentials();
  })
  
  /////
  // Add Container //
               /////
  var addContainer = $('#add_container');
  
  // platfrom prefill
  if (options.platform) {
    addContainer.platform.value = options.platform
  }

  // create new fields
  addContainer.addEventListener('blur', function(event) {
    var keyval = event.target.parentElement
    if( event.target.name == 'value' && 
        keyval == addContainer.lastElementChild &&
        keyval.firstElementChild.value.trim().length > 0
      ) {
      var newOne = event.target.parentElement.cloneNode(true);
      Array.prototype.slice.call(newOne.getElementsByTagName('input')).forEach(function(i) {
        i.value = '';
      })
      addContainer.appendChild(newOne);
      setTimeout(function(){
        newOne.firstElementChild.focus()
      },0);
    }
  }, true)  
  
  // save button
  addContainer.querySelector('#save').addEventListener('click', function(event) {
    event.preventDefault();
    
    var platform = addContainer.platform.value;
    var persona = addContainer.persona.value;
    
    if(!platform || !persona)
      return;
    
    var data = {}
    var keyvals = Array.prototype.slice.call(addContainer.querySelectorAll('.add-key-val'));
    keyvals.forEach(function(keyval) {
      var k = keyval.querySelector('input[name="key"]').value;
      if(k) {
        var v = keyval.querySelector('input[name="value"]').value;
        data[k] = v;
      }
    })
    rs.credentials.add(platform, persona, data);
    listView(true);
  });

  //cancel button
  addContainer.querySelector('#cancel').addEventListener('click', function(event){
    event.preventDefault();
    listView();
  })

  /////
  // key events //
            /////
  // add dialog
  addContainer.addEventListener('keydown', function(event){
    if(event.keyCode == 13 )  //Enter
      addContainer.querySelector('#save').click();
    if(event.keyCode == 27) //Esc
      addContainer.querySelector('#cancel').click();
  })
  
  // alt magic
  document.addEventListener('keyup', function(event) {
    console.log(event)
    if(!event.altKey && event.keyCode == 18 ) //alt pressed
      document.body.classList.remove('alt-down')
  })
  document.addEventListener('keydown', function(event) {
    if(event.altKey && event.keyCode == 18 ) //alt pressed
      document.body.classList.add('alt-down')
  })
  
  // window
  document.addEventListener('keydown', function(event) {
    console.log('keyCode : ', event.keyCode)
    console.log('charCode : ', event.charCode)
    console.log(event);
    if(event.target!=document.body) //some input is selected, we are in add mode
      return;
    
    if ([187,107].indexOf(event.keyCode) >= 0) { // plus + and =
      event.preventDefault();
      add();
    }
    else if(event.keyCode == 27) {   // Esc
      event.preventDefault();
      $('#credentials_container .selected').classList.remove('selected');
     listView();
    } else if(event.keyCode == 46) { // Del
      event.preventDefault();
      del();
    } else if (event.keyCode == 38) { //up
      if ($('#credentials_container').style.display != 'none')
        moveSelected(-1);
    } else if (event.keyCode == 40) { //down
      if ($('#credentials_container').style.display != 'none')
        moveSelected(1);
    } else if(event.keyCode == 37) {  //left
      var selected = $('#credentials_container .selected')
      if (!selected.classList.contains('collapsed'))
        selected.querySelector('.button').click();
    } else if(event.keyCode == 39) {  //righgt
      var selected = $('#credentials_container .selected')
      if (selected.classList.contains('collapsed'))
        selected.querySelector('.button').click();
    } else if (event.altKey) {       // Alt
      if (event.keyCode == 69) {       // M-e
        event.preventDefault();
        options.show = 'persona';
        listView(true)
      } else if (event.keyCode == 76) { // M-l
        event.preventDefault();
        options.show = 'platform';
        listView(true)
      } else if (event.keyCode == 71) { // M-g
        go();
      }
    } else if (event.ctrlKey && event.keyCode == 13) { // C-return
      go();
    }
  })
    
  return ':)';
}

/////
// RemoteStorage //
             /////

function initRs(){
  //rs.caching.disable('/');
  rs.caching.enable('/credentials/');
  rs.access.claim('credentials', 'rw');
  rs.displayWidget();
}

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
    console.log('collapse')
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
    console.log('showPersona :', listing)
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
    $('#verifier').src = URL.createObjectURL(img);
  })
}

function setVerifier(event){
  var img = $("#verifier_source").files[0];
  console.log(img);
  if(img)
    rs.credentials.setVerifier(img.slice()).then(getVerifier);
}


window.addEventListener('load', init);
window.addEventListener('load', initRs);
