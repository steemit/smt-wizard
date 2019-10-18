// Global variables
var _numTokenEmissions = 0;
var _emissionsUnitWidgets = [];

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

function addTokenEmission() {
    _numTokenEmissions++;
    var templateNode = document.getElementById( "token_emission_template" ).cloneNode( true );
    templateNode.id = "token_emission_" + _numTokenEmissions;
    templateNode.querySelector("legend").innerHTML += " " + _numTokenEmissions;
    appendFormElements( templateNode.querySelectorAll('*'), _numTokenEmissions );
    document.getElementById( "token_emissions" ).appendChild( templateNode );
    createEmissionsUnitWidget( document.getElementById( "emissions_unit_" + _numTokenEmissions ) );
}

function removeTokenEmission() {
    if ( _numTokenEmissions == 0 ) return;

    var element = document.getElementById( "token_emission_" + _numTokenEmissions );
    delete _emissionsUnitWidgets[ "emissions_unit_" + _numTokenEmissions ];
    element.parentNode.removeChild( element );
    _numTokenEmissions--;
}

function appendFormElements( elements, append ) {
   for ( i = 0; i < elements.length; i++ ) {
      var e = elements[i];

      if ( e.tagName == "LABEL" ) {
         e.htmlFor += "_" + append;
      } else if ( e.tagName == "INPUT" || e.tagName == "TEXTAREA" ) {
         e.name += "_" + append;
         e.id += "_" + append;
      } else if ( e.id == "" ) {
      } else {
         e.id += "_" + append;
      }
   }
}

function onAllowVotingClicked( e ) {
    var disabled = !e.checked;

    var voting_options = document.getElementById('voting_options').style;
    voting_options.display = disabled ? 'none' : 'block';
    /*
    getField( "allow_downvoting" ).disabled = disabled;
    getField( "cashout_window_seconds" ).disabled = disabled;
    getField( "reverse_auction_window_seconds" ).disabled = disabled;
    getField( "vote_regeneration_period_seconds" ).disabled = disabled;
    getField( "votes_per_regeneration_period" ).disabled = disabled;
    getField( "content_constant" ).disabled = disabled;
    getField( "percent_curation_rewards" ).disabled = disabled;

    function toggleRadios( elementName, disable ) {
        var radios = document.getElementsByName( elementName );
        for ( i = 0, length = radios.length; i < length; i++ ) {
            radios[i].disabled = disable;
        }
    }

    toggleRadios( "author_reward_curve", disabled );
    toggleRadios( "curation_reward_curve", disabled );
    */
}

function getField(fieldName) {
    var els = document.getElementsByName(fieldName);
    if(els.length > 1) throw "unexpected multiple fields for " + fieldName;
    return els[0]
}

function getFlatMapValue( elementName ) {
    var widgetData = _emissionsUnitWidgets[ elementName ].getAllValue(true);
    console.log(widgetData);
    var flatMap = [];
    for ( i = 0; i < widgetData._RowCount; i++ ) {
        flatMap.push([ widgetData[ 'destination_'+ i ], widgetData[ 'units_' + i ] ]);
    }
    console.log(flatMap);
    return flatMap;
}

function getValue(elementName) {
    var els = document.getElementsByName(elementName);
    if(els.length == 0) {
        throw "nothing found for " + elementName;
    }
    var el = els[0];
    if(els.length > 1 && el.nodeName !== 'INPUT' && el.type !== 'radio') {
        throw "unexpected multiple els for " + elementName;
    }

    switch (el.nodeName) {
        case 'INPUT':
            switch (el.type) {
                case 'text':
                case 'number':
                    return el.value;
                case 'checkbox':
                    return el.checked;
                case 'radio':
                    for ( i = 0, length = els.length; i < length; i++ ) {
                        if (els[i].checked) return els[i].value;
                    }
                    return null;
                }
                case 'datetime-local':
                    return el.value;
        case 'TEXTAREA':
            return el.value;
        case 'SELECT':
            return el.options[el.selectedIndex].value;
        case 'BUTTON':
            throw "button value??" + elementName + " " + el.value;
    }
    throw "unhandled nodeName " + el.nodeName + " for " + elementName;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function asyncGetNaiFromPool() {
    return new Promise( function( resolve, reject ) {
        var http = new XMLHttpRequest();
        var url = 'https://testnet.steemitdev.com';
        var payload = '{"jsonrpc":"2.0","method":"database_api.get_nai_pool","params":{},"id":1}';
        http.open('POST', url, true);

        http.setRequestHeader( 'Content-Type', 'application/json' );

        http.onreadystatechange = function() {
            if ( http.readyState != 4 ) return;

            if ( http.status == 200 ) {
                var json = JSON.parse( http.responseText );
                if ( json.result.nai_pool.length > 0 ) {
                    // We choose a random NAI to decrease the likelihood of two or 
                    // more people clashing while trying to claim a NAI
                    var index = getRandomInt( 0, json.result.nai_pool.length - 1 );
                    resolve( json.result.nai_pool[ index ] );
                }
                else {
                    reject( "No available NAIs!" );
                }
            }
            else {
                reject( http.status );
            }
        }
        http.send( payload );
    });
}


async function createToken() {

    // Common values for all operations
    var controlAccount = getValue( "control_account" );
    var symbol = await asyncGetNaiFromPool();
    //var symbol = { nai: "@@1234567", decimals: 0 };
    symbol.decimals = getValue( "precision" );

    var transaction = {};
    transaction.operations = [];

    transaction.operations.push([
        'smt_create', {
             'control_account'  : controlAccount,
             'symbol'           : symbol,
             'precision'        : symbol.decimals,
             'smt_creation_fee' : {
                 'amount': '1000',
                 'precision': 3,
                 'nai': '@@000000013'
             }
        }
    ]);

    transaction.operations.push([
        'smt_set_setup_parameters', {
             'control_account'  : controlAccount,
             'symbol'           : symbol,
             'allow_voting'     : getValue( "allow_voting" )
        }
    ]);

    transaction.operations.push([
        'smt_set_runtime_parameters', {
            'control_account'                  : controlAccount,
            'symbol'                           : symbol,
            'allow_downvoting'                 : getValue( "allow_downvoting" ),
            'cashout_window_seconds'           : getValue( "cashout_window_seconds" ),
            'reverse_auction_window_seconds'   : getValue( "reverse_auction_window_seconds" ),
            'vote_regeneration_period_seconds' : getValue( "vote_regeneration_period_seconds" ),
            'votes_per_regeneration_period'    : getValue( "votes_per_regeneration_period" ),
            'content_constant'                 : getValue( "content_constant" ),
            'percent_curation_rewards'         : getValue( "percent_curation_rewards" ),
            'author_reward_curve'              : getValue( "author_reward_curve" ),
            'curation_reward_curve'            : getValue( "curation_reward_curve" )
        }
    ]);

    for ( i = 1; i <= _numTokenEmissions; i++ ) {
        transaction.operations.push([
            'smt_setup_emissions', {
                'control_account'       : controlAccount,
                'symbol'                : symbol,
                'schedule_time'         : getValue( "schedule_time_" + i ),
                'lep_time'              : getValue( "lep_time_" + i ),
                'rep_time'              : getValue( "rep_time_" + i ),
                'interval_seconds'      : getValue( "interval_seconds_" + i ),
                'interval_count'        : getValue( "interval_count_" + i ),
                'lep_abs_amount'        : getValue( "lep_abs_amount_" + i ),
                'rep_abs_amount'        : getValue( "rep_abs_amount_" + i ),
                'lep_rel_numerator'     : getValue( "lep_rel_numerator_" + i ),
                'rep_rel_numerator'     : getValue( "rep_rel_numerator_" + i ),
                'rel_amount_denom_bits' : getValue( "rel_amount_denom_bits_" + i ),
                'floor_emissions'       : getValue( "floor_emissions_" + i ),
                'emissions_unit'        : getFlatMapValue( "emissions_unit_" + i )
            }
        ]);
    }

    transaction.operations.push([
        'smt_setup', {
            'control_account'         : controlAccount,
            'symbol'                  : symbol,
            'max_supply'              : getValue( "max_supply" ),
            'contribution_begin_time' : getValue( "contribution_begin_time" ),
            'contribution_end_time'   : getValue( "contribution_end_time" ),
            'launch_time'             : getValue( "launch_time" ),
            'steem_units_min'         : getValue( "steem_units_min" ),
            'steem_units_soft_cap'    : getValue( "steem_units_soft_cap" ),
            'steem_units_hard_cap'    : getValue( "steem_units_hard_cap" ),
            'initial_generation_policy' : {
                'pre_soft_cap_steem_unit'  : getFlatMapValue( "pre_soft_cap_steem_unit" ),
                'pre_soft_cap_token_unit'  : getFlatMapValue( "pre_soft_cap_token_unit" ),
                'post_soft_cap_steem_unit' : getFlatMapValue( "post_soft_cap_steem_unit" ),
                'post_soft_cap_token_unit' : getFlatMapValue( "post_soft_cap_token_unit" ),
                'min_unit_ratio'           : getValue( "min_unit_ratio" ),
                'max_unit_ratio'           : getValue( "max_unit_ratio" )
            }
        }
    ]);

    console.log( transaction );
}

function createEmissionsUnitWidget( element )
{
    _emissionsUnitWidgets[ element.id ] = new AppendGrid({
        element: element,
        uiFramework: 'bootstrap4',
        iconFramework: 'fontawesome5',
        columns: [{
            name: 'destination',
            display: 'Destination',
            type: 'text'
        }, {
            name: 'units',
            display: 'Units',
            type: 'number',
            ctrlAttr: {
                "min" : 0,
                "max" : 255,
                "step": 1
            }
        }],
        hideButtons: {
            moveUp: true,
            moveDown: true,
            insert: true,
            remove: true
        },
        sectionClasses: {
            // Add `table-sm` class from Bootstrap that reduce cell padding
            table: 'table-sm',
            // Add `btn-group-sm` class from Bootstrap that generate a smaller button groups
            buttonGroup: 'btn-group-sm',
            // Add `form-control-sm` class from Bootstrap that reduce the size of input controls
            control: 'form-control-sm'
        },
        hideRowNumColumn: true,
        initRows: 1
    });
    return _emissionsUnitWidgets[ element.id ];
}
$(document).ready( function () {
    $( ".flat-map" ).each( function( index, element ) {
        createEmissionsUnitWidget( element );
    });
} );
