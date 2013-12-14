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
  rs.credentials.remove(data.platform, data.persona).then(function(status) {
    if(status < 200 && status > 300)
      throw status;
    if(item.parentElement.previousElementSibling.classList.contains('key') && item.parentElement.children.length == 1 ) {
      item.parentElement.previousSibling.remove();
      item.parentElement.remove();
    } else {
      item.remove();
    }
  } ).then(function() {

    notify('restore credential  ' +data.platform + ' : ' + data.persona, 
           function(){
             rs.credentials.add(data.platform, data.persona, JSON.parse(data.credential)).then(showCredentials).then(listView);
           });
  })
}

function notify(msg, cb) {
  
  var el = $('#notify');
  el.classList.remove('hidden');
  var c = cEl('div')
  
  function cleanUp(){
    c.remove();
    if(el.childElementCount == 0)
      el.classList.add('hidden');
  }

  c.textContent = msg;
  c.onclick = function(){
    cleanUp();
    cb(event);
  }
  setTimeout(cleanUp, 23108)
  el.appendChild(c);
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
    // console.log(event)
    if(!event.altKey && event.keyCode == 18 ) //alt pressed
      document.body.classList.remove('alt-down')
  })
  document.addEventListener('keydown', function(event) {
    if(event.altKey && event.keyCode == 18 ) //alt pressed
      document.body.classList.add('alt-down')
  })
  
  // window
  document.addEventListener('keydown', function(event) {
    // console.log('keyCode : ', event.keyCode)
    // console.log('charCode : ', event.charCode)
    // console.log(event);
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

window.addEventListener('load', init);

