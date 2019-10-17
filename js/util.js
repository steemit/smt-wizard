// Global variables
var _numTokenEmissions = 0;

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

function getRadiosValue( elementName ) {
    var radios = document.getElementsByName( elementName );

    for ( i = 0, length = radios.length; i < length; i++ ) {
        if ( radios[i].checked ) {
            return radios[i].value;
        }
    }
    return null;
}

function toggleRadios( elementName, disable ) {
    var radios = document.getElementsByName( elementName );
    for ( i = 0, length = radios.length; i < length; i++ ) {
        radios[i].disabled = disable;
    }
}

function addTokenEmission() {
    _numTokenEmissions++;
    var templateNode = document.getElementById( "token-emission-template" ).cloneNode( true );
    templateNode.id = "token-emission-" + _numTokenEmissions;
    templateNode.querySelector( "#token-emission-legend" ).innerHTML += " " + _numTokenEmissions;
    appendFormElements( templateNode.querySelectorAll('*'), _numTokenEmissions );
    document.getElementById( "token-emissions" ).appendChild( templateNode );
}

function removeTokenEmission() {
    if ( _numTokenEmissions == 0 ) return;

    var element = document.getElementById( "token-emission-" + _numTokenEmissions );
    element.parentNode.removeChild( element );
    _numTokenEmissions--;
}

function onAllowVotingClicked( e ) {
    document.getElementById( "allow-downvoting" ).disabled = !e.checked;
    document.getElementById( "cashout-window-seconds" ).disabled = !e.checked;
    document.getElementById( "reverse-auction-window-seconds" ).disabled = !e.checked;
    document.getElementById( "vote-regeneration-period-seconds" ).disabled = !e.checked;
    document.getElementById( "votes-per-regeneration-period" ).disabled = !e.checked;
    document.getElementById( "content-constant" ).disabled = !e.checked;
    document.getElementById( "percent-curation-rewards" ).disabled = !e.checked;
    toggleRadios( "author_reward_curve", !e.checked );
    toggleRadios( "curation_reward_curve", !e.checked );
}

async function asyncGetNaiFromPool() {
    return new Promise( function( resolve, reject ) {
        var http = new XMLHttpRequest();
        var url = 'https://testnet.steemitdev.com';
        var payload = '{"jsonrpc":"2.0","method":"database_api.get_nai_pool","params":{},"id":1}';
        http.open('POST', url, true);

        http.setRequestHeader( 'Content-type', 'application/json' );

        http.onreadystatechange = function() {
            if ( http.readyState != 4 ) return;

            if ( http.status == 200 ) {
                var json = JSON.parse( http.responseText );
                if ( json.result.nai_pool.length > 0 ) {
                    resolve( json.result.nai_pool[0] );
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
    var controlAccount = document.getElementById( "control-account" ).value;
    var symbol = await asyncGetNaiFromPool();
    symbol.decimals = document.getElementById( "precision" ).value;

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
             'allow_voting'     : document.getElementById( "allow-voting" ).checked
        }
    ]);

    transaction.operations.push([
        'smt_set_runtime_parameters', {
            'control_account'                  : controlAccount,
            'symbol'                           : symbol,
            'allow_downvoting'                 : document.getElementById( "allow-downvoting" ).checked,
            'cashout_window_seconds'           : document.getElementById( "cashout-window-seconds" ).value,
            'reverse_auction_window_seconds'   : document.getElementById( "reverse-auction-window-seconds" ).value,
            'vote_regeneration_period_seconds' : document.getElementById( "vote-regeneration-period-seconds" ).value,
            'votes_per_regeneration_period'    : document.getElementById( "votes-per-regeneration-period" ).value,
            'content_constant'                 : document.getElementById( "content-constant" ).value,
            'percent_curation_rewards'         : document.getElementById( "percent-curation-rewards" ).value,
            'author_reward_curve'              : getRadiosValue( "author_reward_curve" ),
            'curation_reward_curve'            : getRadiosValue( "curation_reward_curve" )
        }
    ]);

    for ( i = 1; i <= _numTokenEmissions; i++ ) {
        transaction.operations.push([
            'smt_setup_emissions', {
                'control_account'       : controlAccount,
                'symbol'                : symbol,
                'schedule_time'         : document.getElementById( "schedule-time-" + i ).value,
                'lep_time'              : document.getElementById( "lep-time-" + i ).value,
                'rep_time'              : document.getElementById( "rep-time-" + i ).value,
                'interval_seconds'      : document.getElementById( "interval-seconds-" + i ).value,
                'interval_count'        : document.getElementById( "interval-count-" + i ).value,
                'lep_abs_amount'        : document.getElementById( "lep-abs-amount-" + i ).value,
                'rep_abs_amount'        : document.getElementById( "rep-abs-amount-" + i ).value,
                'lep_rel_numerator'     : document.getElementById( "lep-rel-numerator-" + i ).value,
                'rep_rel_numerator'     : document.getElementById( "rep-rel-numerator-" + i ).value,
                'rel_amount_denom_bits' : document.getElementById( "rel-amount-denom-bits-" + i ).value,
                'floor_emissions'       : document.getElementById( "floor-emissions-" + i ).checked,
                'emissions_unit'        : document.getElementById( "emissions-unit-" + i ).value
            }
        ]);
    }

    transaction.operations.push([
        'smt_setup', {
            'control_account'         : controlAccount,
            'symbol'                  : symbol,
            'max_supply'              : document.getElementById( "max-supply" ).value,
            'contribution_begin_time' : document.getElementById( "contribution-begin-time" ).value,
            'contribution_end_time'   : document.getElementById( "contribution-end-time" ).value,
            'launch_time'             : document.getElementById( "launch-time" ).value,
            'steem_units_min'         : document.getElementById( "steem-units-min" ).value,
            'steem_units_soft_cap'     : document.getElementById( "steem-units-soft-cap" ).value,
            'steem_units_hard_cap'     : document.getElementById( "steem-units-hard-cap" ).value,
            'initial_generation_policy' : {
                'pre_soft_cap_steem_unit'  : document.getElementById( "pre-soft-cap-steem-unit" ).value,
                'pre_soft_cap_token_unit'  : document.getElementById( "pre-soft-cap-token-unit" ).value,
                'post_soft_cap_steem_unit' : document.getElementById( "post-soft-cap-steem-unit" ).value,
                'post_soft_cap_token_unit' : document.getElementById( "post-soft-cap-token-unit" ).value,
                'min_unit_ratio'         : document.getElementById( "min-unit-ratio" ).value,
                'max_unit_ratio'         : document.getElementById( "max-unit-ratio" ).value
            }
        }
    ]);

    console.log( transaction );
}

