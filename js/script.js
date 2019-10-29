$(document).ready(function () {
    var current_page, next_page, previous_page; // Form pages
    var left, opacity, scale;                   // Form page properties which we will animate
    var animating;                              // Flag to prevent quick multi-click glitches
    var destination_unit_widgets = [];          // Holds a mapping of the Element ID and AppendGrid object
    var num_token_emissions = 0;                // The number of Token Emissions

    // Connect SteemJS to the testnet
    steem.api.setOptions({
        url: 'https://testnet.steemitdev.com',
        retry: false,
        address_prefix: 'TST',
        chain_id: '46d82ab7d8db682eb1959aed0ada039a6d49afa1602491f93dde9cac3e8e6c32',
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

    /*
    // This will disable the next button until all fields are valid
    $('.next').attr('disabled', true);
    $("input,select,textarea").bind("keyup change", function(e) {
        var visible_form_is_valid = true;
        $('.needs-validation').find('input:visible').each(function () {
            if (!this.checkValidity()) {
                visible_form_is_valid = false;
            }
        });
        if (visible_form_is_valid) {
            $('.next:visible').attr('disabled', false);
        }
    });
    */

    // On blur validation listener for form elements
    $('.needs-validation').find('input,select,textarea').on('focusout', function () {
        validationFeedback( this );
    });

    function createDestinationUnitWidget(element) {
        destination_unit_widgets[element.id] = new AppendGrid({
            element: element,
            uiFramework: 'bootstrap4',
            iconFramework: 'fontawesome5',
            columns: [{
                name: 'destination',
                display: 'Destination',
                type: 'text',
                ctrlAttr: {
                    "minlength": 3,
                    "maxlength": 32,
                    "required": true
                },
                ctrlAdded: function (element) {
                    $(element).on('focusout', function() {
                        validationFeedback( this );
                    });
                }
            }, {
                name: 'units',
                display: 'Units',
                type: 'number',
                ctrlAttr: {
                    "min": 0,
                    "max": 255,
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
            flatMap.push([widgetData['destination_' + i], parseInt(widgetData['units_' + i])]);
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

    $('[name="add_token_emission_button"]').click( function() {
        num_token_emissions++;

        function appendFormElements(elements, append) {
            for (i = 0; i < elements.length; i++) {
                var e = elements[i];

                if (e.tagName == "LABEL") {
                    e.htmlFor += "_" + append;
                } else if (e.tagName == "INPUT" || e.tagName == "TEXTAREA") {
                    e.name += "_" + append;
                    e.id += "_" + append;
                } else if (e.id == "") {
                } else {
                    e.id += "_" + append;
                }
            }
        }

        var templateNode = document.getElementById("token_emission_template").cloneNode(true);
        templateNode.id = "token_emission_" + num_token_emissions;
        templateNode.querySelector("h4").innerHTML += " " + num_token_emissions;
        appendFormElements(templateNode.querySelectorAll('*'), num_token_emissions);
        document.getElementById("token_emissions").appendChild(templateNode);

        $('#' + templateNode.id).find('input,select,textarea').on('focusout', function () {
            validationFeedback( this );
        });

        createDestinationUnitWidget(document.getElementById("emissions_unit_" + num_token_emissions));
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

    // We issue a click just to add a Token Emission by default
    $('[name="add_token_emission_button"]').click();

    $(".flat-map").each(function (index, element) {
        createDestinationUnitWidget(element);
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

    async function createToken()
    {
        // Common values for all operations
        var controlAccount = getValue("control_account");
        var symbol = await asyncGetNaiFromPool();
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
                    'allow_downvoting': getValue("allow_downvoting"),
                    'cashout_window_seconds': getValue("cashout_window_seconds"),
                    'reverse_auction_window_seconds': getValue("reverse_auction_window_seconds"),
                    'vote_regeneration_period_seconds': getValue("vote_regeneration_period_seconds"),
                    'votes_per_regeneration_period': getValue("votes_per_regeneration_period"),
                    'content_constant': getValue("content_constant"),
                    'percent_curation_rewards': getValue("percent_curation_rewards"),
                    'author_reward_curve': getValue("author_reward_curve"),
                    'curation_reward_curve': getValue("curation_reward_curve"),
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

        transaction.operations.push([
            'smt_setup', {
                'control_account': controlAccount,
                'symbol': symbol,
                'max_supply': parseInt(getValue("max_supply")),
                'contribution_begin_time': getValue("contribution_begin_time"),
                'contribution_end_time': getValue("contribution_end_time"),
                'launch_time': getValue("launch_time"),
                'steem_units_min': parseInt(getValue("steem_units_min")),
                'steem_units_soft_cap': parseInt(getValue("steem_units_soft_cap")),
                'steem_units_hard_cap': parseInt(getValue("steem_units_hard_cap")),
                'initial_generation_policy': [0,{
                    'pre_soft_cap_unit': {
                        'steem_unit': getFlatMapValue("pre_soft_cap_steem_unit"),
                        'token_unit': getFlatMapValue("pre_soft_cap_token_unit")
                    },
                    'post_soft_cap_unit': {
                        'steem_unit': getFlatMapValue("post_soft_cap_steem_unit"),
                        'token_unit': getFlatMapValue("post_soft_cap_token_unit"),
                    },
                    'min_unit_ratio': parseInt(getValue("min_unit_ratio")),
                    'max_unit_ratio': parseInt(getValue("max_unit_ratio")),
                    'extensions': []
                }],
                'extensions': []
            }
        ]);

        console.log(transaction);
        console.log(activeWif);
        steem.api.callAsync('condenser_api.get_version', []).then((result) => {
            steem.broadcast._prepareTransaction(transaction).then(function(tx){
              tx = steem.auth.signTransaction(tx, [activeWif]);
              steem.api.verifyAuthorityAsync(tx).then(
                (result) => {result.should.equal(true); console.log(result);},
                (err)    => {console.log(err);}
              );
            });
        });
    }
});
