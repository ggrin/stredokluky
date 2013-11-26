$ = document.querySelector.bind(document);
$_ = document.querySelectorAll.bind(document);
cEl = document.createElement.bind(document);


function queryString(str){
  return str.slice(1).split('&').reduce( 
    function(m, el){ 
      var set = el.split('=');
      if(set[0])
        m[decodeURIComponent(set[0])]=decodeURIComponent(set[1]); 
      return m  
    }, {});
}

function setDataset(el, data) {
  for (var k in data) {
    if(k[0] == '@')
      continue;
    el.dataset[k] = data[k]
  }
}
