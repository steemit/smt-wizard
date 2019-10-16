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

function createToken() {
    // Common values for all operations
    var controlAccount = document.getElementById( "control-account" ).value;
    var symbol = "@@1234567";

    // Gather fields for 'smt_create_operation'
    var createOp = {
        precision      : document.getElementById( "precision" ).value,
        smtCreationFee : "",
    };

    // Gather fields for 'smt_set_setup_parameters_operation'
    var setSetupParameters = {
        allowVoting    : document.getElementById( "allow-voting" ).checked
    };

    // Gather fields for 'smt_set_runtime_parameters_operation'
    var setRuntimeParameters = {
        allowDownvoting               : document.getElementById( "allow-downvoting" ).checked,
        cashoutWindowSeconds          : document.getElementById( "cashout-window-seconds" ).value,
        reverseAuctionWindowSeconds   : document.getElementById( "reverse-auction-window-seconds" ).value,
        voteRegenerationPeriodSeconds : document.getElementById( "vote-regeneration-period-seconds" ).value,
        votesPerRegenerationPeriod    : document.getElementById( "votes-per-regeneration-period" ).value,
        contentConstant               : document.getElementById( "content-constant" ).value,
        percentCurationRewards        : document.getElementById( "percent-curation-rewards" ).value,
        authorRewardCurve             : getRadiosValue( "author_reward_curve" ),
        curationRewardCurve           : getRadiosValue( "curation_reward_curve" )
    };

    // Gather one or more emissions for 'smt_setup_emissions_operation'
    var tokenEmissions = [];
    for ( i = 1; i <= _token_emission_ctr; i++ ) {
        var tokenEmission = {
            scheduleTime    : document.getElementById( "schedule-time-" + i ).value,
            lepTime         : document.getElementById( "lep-time-" + i ).value,
            repTime         : document.getElementById( "rep-time-" + i ).value,
            intervalSeconds : document.getElementById( "interval-seconds-" + i ).value,
            intervalCount   : document.getElementById( "interval-count-" + i ).value,
            lepAbsAmount    : document.getElementById( "lep-abs-amount-" + i ).value,
            repAbsAmount    : document.getElementById( "rep-abs-amount-" + i ).value,
            lepRelNumerator : document.getElementById( "lep-rel-numerator-" + i ).value,
            repRelNumerator : document.getElementById( "rep-rel-numerator-" + i ).value,
            relAmtDenomBits : document.getElementById( "rel-amount-denom-bits-" + i ).value,
            floorEmissions  : document.getElementById( "floor-emissions-" + i ).checked,
            emissionsUnit   : document.getElementById( "emissions-unit-" + i ).value
        };
        tokenEmissions.push( tokenEmission );
    }

    var setupOp = {
        maxSupply             : document.getElementById( "max-supply" ).value,
        contributionBeginTime : document.getElementById( "contribution-begin-time" ).value,
        contributionEndTime   : document.getElementById( "contribution-end-time" ).value,
        launchTime            : document.getElementById( "launch-time" ).value,
        steemUnitsMin         : document.getElementById( "steem-units-min" ).value,
        steemUnitsSoftCap     : document.getElementById( "steem-units-soft-cap" ).value,
        steemUnitsHardCap     : document.getElementById( "steem-units-hard-cap" ).value,
        initialGenerationPolicy : {
            preSoftCapSteemUnit  : document.getElementById( "pre-soft-cap-steem-unit" ).value,
            preSoftCapTokenUnit  : document.getElementById( "pre-soft-cap-token-unit" ).value,
            postSoftCapSteemUnit : document.getElementById( "post-soft-cap-steem-unit" ).value,
            postSoftCapTokenUnit : document.getElementById( "post-soft-cap-token-unit" ).value,
            minUnitRatio         : document.getElementById( "min-unit-ratio" ).value,
            maxUnitRatio         : document.getElementById( "max-unit-ratio" ).value
        }
    };

    console.log( createOp );
    console.log( setSetupParameters );
    console.log( setRuntimeParameters );
    console.log( tokenEmissions );
    console.log( setupOp );
}
