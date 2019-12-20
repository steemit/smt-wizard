$(document).ready(function () {
    var current_page, next_page, previous_page; // Form pages
    var left, opacity, scale;                   // Form page properties which we will animate
    var animating;                              // Flag to prevent quick multi-click glitches
    var destination_unit_widgets = [];          // Holds a mapping of the Element ID and AppendGrid object
    var num_token_emissions = 0;                // The number of Token Emissions
    var num_ico_tiers = 0;                      // The number of ICO tiers
    const MAX_ICO_TIERS = 10;
    const destination_type = {
        TOKEN_EMISSIONS: 'token_emissions',
        ICO_STEEM: 'ico_steem',
        ICO_TOKEN: 'ico_token'
    };

    async function asyncGetChainID() {
        return new Promise( function( resolve, reject ) {
            var http = new XMLHttpRequest();
            var url = 'https://testnet.steemitdev.com';
            var payload = '{"jsonrpc":"2.0","method":"database_api.get_version","params":{},"id":1}';
            http.open('POST', url, true);

            http.setRequestHeader( 'Content-Type', 'application/json' );

            http.onreadystatechange = function() {
                if ( http.readyState != 4 ) return;

                if ( http.status == 200 ) {
                    var json = JSON.parse( http.responseText );
                    if ( json.result.chain_id !== undefined ) {
                        resolve( json.result.chain_id );
                    }
                    else {
                        reject( "Could not find Chain ID!" );
                    }
                }
                else {
                    reject( http.status );
                }
            }
            http.send( payload );
        });
    }

    asyncGetChainID().then(async chainId => {
        // Connect SteemJS to the testnet
        steem.api.setOptions({
            url: 'https://testnet.steemitdev.com',
            retry: false,
            address_prefix: 'TST',
            chain_id: chainId,
            useAppbaseApi: true,
        });

        // Example to show connectivity in the console:
        steem.api.getDynamicGlobalProperties(function (err, result) {
            if (!err) {
                console.log(result);
            }
            else {
                console.log(err);
            }
        });

        function validationFeedback( object, callbacks ) {
            // Check element validity and change class
            $(object).removeClass('is-valid is-invalid').addClass(object.checkValidity() ? 'is-valid' : 'is-invalid');
            if (object.checkValidity()) {
                $(object).removeClass('is-valid is-invalid').addClass('is-valid');
                $(object).closest('.form-group').find('.valid-feedback').show();
                $(object).closest('.form-group').find('.invalid-feedback').hide();
                if (typeof callbacks !== "undefined" && typeof callbacks.onValid !== "undefined")
                    callbacks.onValid( object );
            }
            else {
                $(object).removeClass('is-valid is-invalid').addClass('is-invalid');
                $(object).closest('.form-group').find('.valid-feedback').hide();
                $(object).closest('.form-group').find('.invalid-feedback').show();
                if (typeof callbacks !== "undefined" && typeof callbacks.onInvalid !== "undefined")
                    callbacks.onInvalid( object );
            }
        }

        // Initialize static datetime pickers
        $('#contribution_begin_time').datetimepicker();
        $('#contribution_end_time').datetimepicker();
        $('#launch_time').datetimepicker();

        // On blur validation listener for form elements
        $('.needs-validation').find('input,select,textarea').on('focusout', function () {
            validationFeedback( this );
        });

        function createDestinationUnitWidget(element, destinationType) {
            var destinationTypeOptions = ["Account", "Account Vesting", "Market Maker"];
            switch (destinationType) {
                case destination_type.ICO_STEEM:
                    break;
                case destination_type.ICO_TOKEN:
                    destinationTypeOptions.push("Contributor", "Contributor Vesting", "Rewards");
                    break;
                case destination_type.TOKEN_EMISSIONS:
                    destinationTypeOptions.push("Rewards", "Vesting");
                    break;
                default:
                    throw "Invalid Destination Type!";
            }

            destination_unit_widgets[element.id] = new AppendGrid({
                element: element,
                uiFramework: 'bootstrap4',
                iconFramework: 'fontawesome5',
                columns: [{
                    name: "destination",
                    display: "Destination",
                    type: "select",
                    ctrlOptions: destinationTypeOptions,
                    ctrlClass: 'selectpicker',
                    ctrlAdded: function (element) {
                        $(element).selectpicker();
                    },
                    displayCss: {
                        "width": "33.33%"
                    },
                    events: {
                        // Add change event
                        change: function(e) {
                            var element = $(e.srcElement);
                            var accountInputElement = element.closest('td').next().find('input');
                            accountInputElement.removeClass('is-valid is-invalid');
                            if ( element.val() != "Account" && element.val() != "Account Vesting") {
                                accountInputElement.val('');
                                accountInputElement.attr('disabled', true);
                            }
                            else {
                                accountInputElement.attr('disabled', false);
                            }
                        }
                    }
                }, {
                    name: 'account',
                    display: 'Account',
                    type: "custom",
                    customBuilder: function(parent, idPrefix, name, uniqueIndex) {
                        // Prepare input group which is a component of Bootstrap
                        var inputGroup = document.createElement("div");
                        inputGroup.classList.add("input-group");
                        inputGroup.classList.add("input-group-sm");
                        parent.appendChild(inputGroup);
                        // Prepare input group prepend holder
                        var inputGroupPrepend = document.createElement("div");
                        inputGroupPrepend.classList.add("input-group-prepend");
                        inputGroup.appendChild(inputGroupPrepend);
                        // Prepare input group prepend text
                        var inputGroupPrependText = document.createElement("span");
                        inputGroupPrependText.innerText = "@";
                        inputGroupPrependText.classList.add("input-group-text");
                        inputGroupPrepend.appendChild(inputGroupPrependText);
                        // Create the input element
                        var inputControl = document.createElement("input");
                        inputControl.id = idPrefix + "_" + name + "_" + uniqueIndex;
                        inputControl.name = inputControl.id;
                        inputControl.type = "text";
                        inputControl.minLength = 3;
                        inputControl.maxLength = 32;
                        inputControl.required = true;
                        inputControl.classList.add("form-control");
                        inputControl.classList.add("form-control-sm");
                        $(inputControl).on('focusout', function() {
                            validationFeedback( this );
                        });
                        inputGroup.appendChild(inputControl);
                    },
                    customGetter: function(idPrefix, name, uniqueIndex) {
                        // Get the value of input element
                        var controlId = "#" + idPrefix + "_" + name + "_" + uniqueIndex;
                        return $(controlId).val();
                    },
                    customSetter: function(idPrefix, name, uniqueIndex, value) {
                        // Set the value of input element
                        var controlId = "#" + idPrefix + "_" + name + "_" + uniqueIndex;
                        $(controlId).val(value);
                    }
                }, {
                    name: 'units',
                    display: 'Units',
                    type: 'number',
                    ctrlAttr: {
                        "min": 1,
                        "max": 65535,
                        "step": 1,
                        "required": true
                    },
                    ctrlAdded: function (element) {
                        $(element).on('focusout', function() {
                            validationFeedback( this );
                        });
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
                initRows: 1,
                beforeRowRemove: function(caller, rowIndex) {
                    // We don't allow the user to have an empty flat map
                    if (rowIndex == 0)
                        return false;

                    return true;
                }
            });
            return destination_unit_widgets[element.id];
        }

        function getFlatMapValue(elementName) {
            var widgetData = destination_unit_widgets[elementName].getAllValue(true);
            var flatMap = [];
            for (i = 0; i < widgetData._RowCount; i++) {
                var key = '';
                switch (widgetData['destination_' + i]) {
                    case 'Account':
                        key = widgetData['account_' + i];
                        break;
                    case 'Account Vesting':
                        key += '$!';
                        key += widgetData['account_' + i];
                        key += '.vesting';
                        break;
                    case 'Market Maker':
                        key = '$market_maker';
                        break;
                    case 'Rewards':
                        key = '$rewards';
                        break;
                    case 'Vesting':
                        key = '$vesting';
                        break;
                    case 'Contributor':
                        key = '$from';
                        break;
                    case 'Contributor Vesting':
                        key = '$from.vesting';
                        break;
                    default:
                        throw 'Invalid Destination Unit!';
                }
                flatMap.push([key, parseInt(widgetData['units_' + i])]);
            }
            return flatMap;
        }

        function getValue(elementName) {
            var els = document.getElementsByName(elementName);
            if (els.length == 0) {
                throw "nothing found for " + elementName;
            }
            var el = els[0];
            if (els.length > 1 && el.nodeName !== 'INPUT' && el.type !== 'radio') {
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
                            for (i = 0, length = els.length; i < length; i++) {
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


        async function asyncGetNaiFromPool() {
            return new Promise(function (resolve, reject) {
                function getRandomInt(min, max) {
                    min = Math.ceil(min);
                    max = Math.floor(max);
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }

                steem.api.callAsync('condenser_api.get_nai_pool', []).then((result) => {
                    var index = getRandomInt(0, result.length - 1);
                    resolve(result[index]);
                }).catch((err) => { reject("No available NAIs!"); });
            });
        }

        function appendFormElements(elements, append) {
            for (i = 0; i < elements.length; i++) {
                var e = elements[i];

                if (e.tagName == "LABEL") {
                    e.htmlFor += "_" + append;
                } else if (e.tagName == "INPUT" || e.tagName == "TEXTAREA") {
                    if ( e.name !== undefined && e.name != '')
                        e.name += "_" + append;
                    if ( e.id !== undefined && e.id != '')
                        e.id += "_" + append;
                } else if (e.id == "") {
                } else {
                    e.id += "_" + append;
                }
            }
        }

        $('[name="add_ico_tier_button"]').click( function() {
            num_ico_tiers++;
            if ( num_ico_tiers == 1)
            {
                $("#ico_tiers_heading").slideDown( "slow" );
            }

            var templateNode = document.getElementById("ico_tier_template").cloneNode(true);
            templateNode.id = "ico_tier_" + num_ico_tiers;
            templateNode.querySelector("h4").innerHTML += " " + num_ico_tiers;
            appendFormElements(templateNode.querySelectorAll('*'), num_ico_tiers);
            document.getElementById("ico_tiers").appendChild(templateNode);

            $('#' + templateNode.id).find('input,select,textarea').on('focusout', function () {
                validationFeedback( this );
            });

            createDestinationUnitWidget(document.getElementById("steem_unit_" + num_ico_tiers), destination_type.ICO_STEEM);
            createDestinationUnitWidget(document.getElementById("token_unit_" + num_ico_tiers), destination_type.ICO_TOKEN);
            $( "#" + templateNode.id ).slideDown( "slow", function() {
                $('[name="remove_ico_tier_button"]').attr('disabled', false);
                if (num_ico_tiers == MAX_ICO_TIERS)
                {
                    $('[name="add_ico_tier_button"]').attr('disabled', true);
                }
            });
        });

        $('[name="remove_ico_tier_button"]').click( function() {
            if (num_ico_tiers == 0) return;

            var element = $('#ico_tier_'+ num_ico_tiers );

            delete destination_unit_widgets["steem_unit_" + num_ico_tiers];
            delete destination_unit_widgets["token_unit_" + num_ico_tiers];
            if ( num_ico_tiers == 1 )
            {
                $("#ico_tiers_heading").slideUp( "slow" );
            }
            element.slideUp( "slow", function() {
                element.remove();
                num_ico_tiers--;
                if (num_ico_tiers == 0) {
                    $('[name="remove_ico_tier_button"]').attr('disabled', true);
                }
                if (num_ico_tiers == MAX_ICO_TIERS - 1) {
                    $('[name="add_ico_tier_button"]').attr('disabled', false);
                }
            });
        });

        $('[name="add_token_emission_button"]').click( function() {
            num_token_emissions++;

            var templateNode = document.getElementById("token_emission_template").cloneNode(true);
            templateNode.id = "token_emission_" + num_token_emissions;
            templateNode.querySelector("h4").innerHTML += " " + num_token_emissions;
            appendFormElements(templateNode.querySelectorAll('*'), num_token_emissions);
            document.getElementById("token_emissions").appendChild(templateNode);

            var scheduleTimeId = '#schedule_time_' + num_token_emissions;
            $(scheduleTimeId).find('input').attr('data-target', scheduleTimeId);
            $(scheduleTimeId).find('div.input-group-append').attr('data-target', scheduleTimeId);
            $(scheduleTimeId).datetimepicker();

            var lepTimeId = '#lep_time_' + num_token_emissions;
            $(lepTimeId).find('input').attr('data-target', lepTimeId);
            $(lepTimeId).find('div.input-group-append').attr('data-target', lepTimeId);
            $(lepTimeId).datetimepicker();

            var repTimeId = '#rep_time_' + num_token_emissions;
            $(repTimeId).find('input').attr('data-target', repTimeId);
            $(repTimeId).find('div.input-group-append').attr('data-target', repTimeId);
            $(repTimeId).datetimepicker();

            $('#' + templateNode.id).find('input,select,textarea').on('focusout', function () {
                validationFeedback( this );
            });

            createDestinationUnitWidget(document.getElementById("emissions_unit_" + num_token_emissions), destination_type.TOKEN_EMISSIONS);
            $( "#" + templateNode.id ).slideDown( "slow", function() {
                $('[name="remove_token_emission_button"]').attr('disabled', false);
            });
        });

        $('[name="remove_token_emission_button"]').click( function() {
            if (num_token_emissions == 0) return;

            var element = $('#token_emission_'+ num_token_emissions );

            delete destination_unit_widgets["emissions_unit_" + num_token_emissions];
            element.slideUp( "slow", function() {
                element.remove();
                num_token_emissions--;
                if (num_token_emissions == 0) {
                    $('[name="remove_token_emission_button"]').attr('disabled', true);
                }
            });
        });

        $('#allow_voting').click( function() {
            var checked = $(this).prop('checked');

            // Things to disable when we do not allow voting
            var names = [
                'allow_downvoting',
                'cashout_window_seconds',
                'reverse_auction_window_seconds',
                'vote_regeneration_period_seconds',
                'votes_per_regeneration_period',
                'content_constant',
                'percent_curation_rewards',
                'author_reward_curve',
                'curation_reward_curve'
            ];

            var dataIds = [
                'author_reward_curve',
                'curation_reward_curve'
            ];

            $.each( names, function( i, val ) {
                $( '[name="'+val+'"]').prop('disabled', !checked);
            });

            $.each( dataIds, function( i, val ) {
                $( '[data-id="'+val+'"]').prop('disabled', !checked);
            });
        });

        $("input[type=button].next").click(function () {
            var visible_form_is_valid = true;
            $('.needs-validation').find('input:visible,select:visible,textarea:visible').each(function () {
                validationFeedback( this, {
                    onInvalid: function( obj ) {
                        visible_form_is_valid = false;
                    }
                });
            });
            if (!visible_form_is_valid) return false;

            if (animating) return false;
            animating = true;

            current_page = $(this).closest('div.form-page');
            next_page = current_page.next();

            // Activate next step on progressbar using the index of next_page
            $("#progressbar li").eq($("div.form-page").index(next_page)).addClass("active");

            // Show the next page
            next_page.show();
            // Hide the current page with style
            current_page.animate({ opacity: 0 }, {
                step: function (now, mx) {
                    // As the opacity of current_page reduces to 0 - stored in "now"
                    // 1. scale current_page down to 80%
                    scale = 1 - (1 - now) * 0.2;
                    // 2. Bring next_page from the right(50%)
                    left = (now * 50) + "%";
                    // 3. Increase opacity of next_page to 1 as it moves in
                    opacity = 1 - now;
                    current_page.css({
                        'transform': 'scale(' + scale + ')',
                        'position': 'absolute'
                    });
                    next_page.css({ 'left': left, 'opacity': opacity });
                },
                duration: 800,
                complete: function () {
                    current_page.hide();
                    animating = false;
                },
                // This comes from the custom easing plugin
                easing: 'easeInOutBack'
            });
        });

        $("input[type=button].previous").click(function () {
            if (animating) return false;
            animating = true;

            current_page = $(this).closest('div.form-page');
            previous_page = current_page.prev();

            // De-activate current step on progressbar
            $("#progressbar li").eq($("div.form-page").index(current_page)).removeClass("active");

            // Show the previous page
            previous_page.show();
            // Hide the current page with style
            current_page.animate({ opacity: 0 }, {
                step: function (now, mx) {
                    // As the opacity of current_page reduces to 0 - stored in "now"
                    // 1. Scale previous_fs from 80% to 100%
                    scale = 0.8 + (1 - now) * 0.2;
                    // 2. Take current_fs to the right(50%) - from 0%
                    left = ((1 - now) * 50) + "%";
                    // 3. Increase opacity of previous_page to 1 as it moves in
                    opacity = 1 - now;
                    current_page.css({ 'left': left });
                    previous_page.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity });
                },
                duration: 800,
                complete: function () {
                    current_page.hide();
                    animating = false;
                },
                // This comes from the custom easing plugin
                easing: 'easeInOutBack'
            });
        });

        $('[name="create_token_button"]').click( async function() {
            var visible_form_is_valid = true;
            $('.needs-validation').find('input:visible,select:visible,textarea:visible').each(function () {
                validationFeedback( this, {
                    onInvalid: function( obj ) {
                        visible_form_is_valid = false;
                    }
                });
            });
            if (!visible_form_is_valid) return false;

            $('#wif-dialog').dialog( "option", "width", $('.form-page').width() * 0.8 );
            $('#wif-dialog').dialog('open');
        });

        $('#wif-dialog').dialog({
            autoOpen: false,
            modal: true,
            buttons: [
                {
                    text: "Cancel",
                    "class": 'btn btn-primary',
                    click: function() {
                        $(this).dialog("close");
                    }
                },
                {
                    text: "Continue",
                    "class": 'btn btn-success',
                    click: function() {
                        var visible_form_is_valid = true;
                        $('#active_wif').each(function () {
                            validationFeedback( this, {
                                onInvalid: function( obj ) {
                                    visible_form_is_valid = false;
                                }
                            });
                        });
                        if (!visible_form_is_valid) return false;
                        createToken();
                        $(this).dialog("close");
                    }
                }
            ],
            closeOnEscape: false,
            open: function(event, ui) {
                $('#control_account_unused').val(getValue("control_account"));
                $(".ui-dialog-titlebar-close", ui.dialog).hide();
                $(".ui-dialog-titlebar", ui.dialog).hide();
            },
            draggable: false,
            resizable: false
        });

        function steemToSatoshi(steemString)
        {
            var steem = parseFloat(steemString);
            steem *= 1000;
            return Math.round(steem);
        }

        function convertPercentage(percentString)
        {
            var percent = parseFloat(percentString);
            percent *= 100;
            return Math.round(percent);
        }

        function createToken()
        {
            asyncGetNaiFromPool().then(nai => {
                // Common values for all operations
                var controlAccount = getValue("control_account");
                var symbol = nai;
                symbol.precision = parseInt(getValue("precision"));
                var activeWif = getValue('active_wif');

                var transaction = {};
                transaction.operations = [];

                transaction.operations.push([
                    'smt_create', {
                        'control_account': controlAccount,
                        'symbol': symbol,
                        'precision': symbol.precision,
                        'smt_creation_fee': {
                            'amount': '1000',
                            'precision': 3,
                            'nai': '@@000000013'
                        },
                        'extensions': []
                    }
                ]);

                transaction.operations.push([
                    'smt_set_setup_parameters', {
                        'control_account': controlAccount,
                        'symbol': symbol,
                        'setup_parameters': [[0,{
                        'value': getValue( "allow_voting" )
                        }]],
                        'extensions': []
                    }
                ]);

                if (getValue("allow_voting")) {
                    transaction.operations.push([
                        'smt_set_runtime_parameters', {
                            'control_account': controlAccount,
                            'symbol': symbol,
                            'runtime_parameters': [
                                [0,
                                    {
                                        'cashout_window_seconds': parseInt(getValue("cashout_window_seconds")),
                                        'reverse_auction_window_seconds': parseInt(getValue("reverse_auction_window_seconds"))
                                    }
                                ],
                                [1,
                                    {
                                        'vote_regeneration_period_seconds': parseInt(getValue("vote_regeneration_period_seconds")),
                                        'votes_per_regeneration_period': parseInt(getValue("votes_per_regeneration_period"))
                                    }
                                ],
                                [2,
                                    {
                                        'content_constant': getValue("content_constant"),
                                        'percent_curation_rewards': convertPercentage(getValue("percent_curation_rewards")),
                                        'author_reward_curve': parseInt(getValue("author_reward_curve")),
                                        'curation_reward_curve': parseInt(getValue("curation_reward_curve"))
                                    }
                                ],
                                [3,
                                    {
                                        'value': getValue("allow_downvoting")
                                    }
                                ]
                            ],
                            'extensions': []
                        }
                    ]);
                }

                for (var i = 1; i <= num_token_emissions; i++) {
                    transaction.operations.push([
                        'smt_setup_emissions', {
                            'control_account': controlAccount,
                            'symbol': symbol,
                            'schedule_time': getValue("schedule_time_" + i),
                            'lep_time': getValue("lep_time_" + i),
                            'rep_time': getValue("rep_time_" + i),
                            'interval_seconds': parseInt(getValue("interval_seconds_" + i)),
                            'interval_count': parseInt(getValue("interval_count_" + i)),
                            'lep_abs_amount': parseInt(getValue("lep_abs_amount_" + i)),
                            'rep_abs_amount': parseInt(getValue("rep_abs_amount_" + i)),
                            'lep_rel_amount_numerator': parseInt(getValue("lep_rel_numerator_" + i)),
                            'rep_rel_amount_numerator': parseInt(getValue("rep_rel_numerator_" + i)),
                            'rel_amount_denom_bits': parseInt(getValue("rel_amount_denom_bits_" + i)),
                            'floor_emissions': getValue("floor_emissions_" + i),
                            'emissions_unit': {
                                'token_unit': getFlatMapValue("emissions_unit_" + i)
                            },
                            'remove': false,
                            'extensions': []
                        }
                    ]);
                }

                for(var i = 1; i <= num_ico_tiers; i++) {
                    transaction.operations.push([
                        'smt_setup_ico_tier', {
                            'control_account': controlAccount,
                            'symbol': symbol,
                            'steem_units_cap': steemToSatoshi(getValue("steem_units_cap_" + i)),
                            'generation_policy': [0,{
                                'generation_unit': {
                                    'steem_unit': getFlatMapValue("steem_unit_" + i),
                                    'token_unit': getFlatMapValue("token_unit_" + i)
                                },
                                'extensions': []
                            }],
                            'remove': false,
                            'extensions': []
                        }
                    ]);
                }

                transaction.operations.push([
                    'smt_setup', {
                        'control_account': controlAccount,
                        'symbol': symbol,
                        'max_supply': parseInt(getValue("max_supply")),
                        'contribution_begin_time': getValue("contribution_begin_time"),
                        'contribution_end_time': getValue("contribution_end_time"),
                        'launch_time': getValue("launch_time"),
                        'steem_units_min': steemToSatoshi(getValue("steem_units_min")),
                        'min_unit_ratio': parseInt(getValue("min_unit_ratio")),
                        'max_unit_ratio': parseInt(getValue("max_unit_ratio")),
                        'extensions': []
                    }
                ]);

                console.log(transaction);
                steem.broadcast.send(transaction, [activeWif], (err, result) => {
                    console.log(err, result);
                });
            });
        }

        setTimeout(function() {
            $('[name="add_ico_tier_button"]').click();
            $('[name="add_token_emission_button"]').click();
        }, 100);
    });
});
