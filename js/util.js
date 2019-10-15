function initializeSteemJS() {
   steem.api.setOptions({
      url: 'https://testnet.steemitdev.com',
      retry: false,
      address_prefix: 'TST',
      chain_id: '46d82ab7d8db682eb1959aed0ada039a6d49afa1602491f93dde9cac3e8e6c32',
      useAppbaseApi: true,
    });
    // example to show connectivity in the console:
    steem.api.getDynamicGlobalProperties(function(err, result) {
      if(!err) {
        console.log(result);
      }
      else {
        console.log(err);
      }
    });
}

function appendFormElements( elements, append ) {
   for ( i = 0; i < elements.length; i++ ) {
      var e = elements[i];
      if ( e.tagName == "LABEL" ) {
         e.htmlFor += "-" + append;
      } else if ( e.tagName == "INPUT" || e.tagName == "TEXTAREA" ) {
         e.name += "_" + append;
         e.id += "-" + append;
      } else {
         e.id += "-" + append;
      }
   }
}

var _token_emission_ctr = 0;
function addTokenEmission() {
    _token_emission_ctr++;
    var templateNode = document.getElementById( "token-emission-template" ).cloneNode( true );
    templateNode.id = "token-emission-" + _token_emission_ctr;
    templateNode.querySelector( "#token-emission-legend" ).innerHTML += " " + _token_emission_ctr;
    appendFormElements( templateNode.querySelectorAll('*'), _token_emission_ctr );
    document.getElementById( "token-emissions" ).appendChild( templateNode );
}

function removeTokenEmission() {
    if ( _token_emission_ctr == 0 ) return;

    var element = document.getElementById( "token-emission-" + _token_emission_ctr );
    element.parentNode.removeChild( element );
    _token_emission_ctr--;
}

