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

