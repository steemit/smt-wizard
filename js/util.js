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

function append_form_elements( elements, append ) {
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
function add_token_emission() {
    _token_emission_ctr++;
    var template_node = document.getElementById( "token-emission-template" ).cloneNode( true );
    template_node.id = "token-emission-" + _token_emission_ctr;
    template_node.querySelector( "#token-emission-legend" ).innerHTML += " " + _token_emission_ctr;
    append_form_elements( template_node.querySelectorAll('*'), _token_emission_ctr );
    document.getElementById( "token-emissions" ).appendChild( template_node );
}

