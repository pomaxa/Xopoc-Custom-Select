(function( $ ){
    var methods = {
        init : function( options ) {

            var defaults = {
                ajaxLoaderClass: 'custom-select-ajax-loader',
                srcElementClass: 'custom-select-default',
                srcElementContainerClass: 'custom-select-default-container',
                customSelectContainerClass: 'custom-select-container',
                customSelectClass: 'custom-select',
                customSelectMultipleClass: 'custom-select-multiple',
                customSelectTitleClass: 'custom-select-title',
                customSelectExpandButtonClass: 'custom-select-expand',
                customSelectClearButtonClass: 'custom-select-clear',
                customSelectListContainerClass: 'custom-select-options-list-container',
                customSelectListClass: 'custom-select-options',
                customSelectOptionsGroupClass: 'custom-select-options-group',
                customSelectOptionsGroupHeaderClass: 'custom-select-options-group-header',
                customSelectOptionsListClass: 'custom-select-options-list',
                customSelectOptionHidden: 'custom-select-option-hidden',
                customSelectFiltersContainerClass: 'custom-select-filters-container',
                customSelectSearchboxClass: 'custom-select-searchbox',
                customSelectSearchButtonClass: 'custom-select-search-button',
                customSelectShowSelectedClass: 'custom-select-show-selected',
                customSelectShowSelectedTitle: 'Show only selected items',
                messagesContainerClass: 'custom-select-messages-container',
                messageClass: 'custom-select-messages-container',
                messageNoItemsSelected: 'No items selected',
                messageNotFound: 'No results match for #needle#',
                messageNotFoundInSelected: 'No results match in selected items for #needle#',
                placeholderText: 'Please select item',
                maxElementsCount: 5,
                selectedClass: 'selected',
                visibleClass: 'show',
                disabledClass: 'disabled',
                multipleOptionsSelectedText: '#selected# of #total# selected',
                extendedSearch: true,
                temp: ''
            }

            return this.each(function(){

                var $this = $(this);

                if(!$this.is('select'))
                {
                    return;
                }


                // If the plugin hasn't been initialized yet
                var data = $this.data('customSelect');
                if ( ! data ) {
                    // new blank config object
                    var config = $.extend(defaults, options);

                    // hide default select and put ajax loader while working with select
                    var ajaxLoader = $('<div />').addClass(config.ajaxLoaderClass).width($this.width());
                    var customSelectContainer = $('<div />').addClass(config.customSelectContainerClass);
                    var srcElementContainer = $('<div />').addClass(config.srcElementContainerClass);
                    customSelectContainer.append(srcElementContainer);
                    customSelectContainer.append(ajaxLoader);
                    $this.replaceWith(customSelectContainer);
                    srcElementContainer.append($this.addClass(config.srcElementClass));


                    // set default custom select layout
                    var customSelect = $('<dl />').addClass(config.customSelectClass);
                    var customSelectDt = $('<dt />');
                    var customSelectDd = $('<dd />');
                    customSelect.append(customSelectDt,customSelectDd);
                    var customSelectTitle = $('<span />').addClass(config.customSelectTitleClass);
                    var customSelectExpand = $('<span />').addClass(config.customSelectExpandButtonClass);
                    var customSelectClear = $('<span />').addClass(config.customSelectClearButtonClass).hide();
                    customSelectDt.append(customSelectTitle,customSelectExpand,customSelectClear);
                    var messagesContainer = $('<div />').addClass(config.messagesContainerClass);
                    var customSelectListContainer = $('<div />').addClass(config.customSelectListContainerClass);
                    customSelectDd.append(messagesContainer,customSelectListContainer);

                    if(config.extendedSearch){
                        var customSelectFiltersContainer = $('<div />').addClass(config.customSelectFiltersContainerClass);
                        var customSelectSearchbox = $('<input />').attr('type','text').addClass(config.customSelectSearchboxClass);
                        var customSelectSearchButton = $('<span />').addClass(config.customSelectSearchButtonClass);
                        var customSelectShowSelected = $('<input />').attr('type','checkbox')
                        .attr('title',config.customSelectShowSelectedTitle)
                        .addClass(config.customSelectShowSelectedClass);
                        customSelectFiltersContainer.append(customSelectSearchbox, customSelectSearchButton);
                        if($this.attr('multiple') !== undefined)
                        {
                            customSelectFiltersContainer.append(customSelectShowSelected);
                        }
                        customSelectDd.prepend(customSelectFiltersContainer);
                    }

                    var inputType = 'radio';
                    if($this.attr('multiple') !== undefined){
                        inputType = 'checkbox';
                        customSelect.addClass(config.customSelectMultipleClass);
                    }

                    // plugin has been initialized
                    $this.data('customSelect',{});
                    $this.data('customSelect',$.extend($this.data('customSelect'), {
                        target : $this,
                        customSelect : customSelect,
                        customSelectContainer : customSelectContainer,
                        customSelectTitle : customSelectTitle,
                        clearSelection : customSelectClear,
                        messagesContainer : messagesContainer,
                        config : config
                    }));


                    // get all options from select and put them in to list
                    var customSelectOptionsList = generateCustomSelectOptions($this, inputType);
                    customSelectListContainer.append(customSelectOptionsList);

                    // bind events
                    // show/hide dropdown
                    customSelectDt.bind('click.customSelect', function(e){
                        e.stopPropagation();
                        if(!$this.is(':disabled')){
                            $this.trigger('focus');
                            if(customSelectDd.hasClass(config.visibleClass))
                            {
                                customSelectDd.removeClass(config.visibleClass);
                                if(config.extendedSearch){
                                    customSelectShowSelected.removeAttr('checked');
                                    customSelectSearchbox.val('').trigger('keyup');
                                }
                            }
                            else
                            {
                                $('.'+config.customSelectContainerClass + ' dd.'+config.visibleClass).removeClass(config.visibleClass);
                                customSelectDd.addClass(config.visibleClass);
                                if(config.extendedSearch){
                                    customSelectSearchbox.trigger('focus');
                                }
                            }
                        }
                    });
                    if(inputType == 'radio'){
                        customSelectListContainer.bind('click.customSelect', function(){
                            customSelectDd.removeClass(config.visibleClass);
                        })
                    }
                    $('body').bind('click.customSelect', function(){
                        customSelectDd.removeClass(config.visibleClass);
                    })
                    customSelect.bind('click.customSelect', function(e){
                        e.stopPropagation();
                    })
                    $this.bind('click.customSelect', function(e){
                        e.stopPropagation();
                    })

                    // select default elements
                    $this.bind('change.customSelect', function(){
                        methods.synchronise( $this );
                    })
                    $this.trigger('change');

                    // disable
                    if($this.is(':disabled')){
                        methods.disable( $this );
                    }
                    customSelectClear.bind('click.customSelect', function(e){
                        e.stopPropagation();
                        methods.clearSelection( $this );
                    });
                    // local search
                    if(config.extendedSearch){
                        customSelectSearchbox.bind('keyup.customSelect',function(){
                            searchLocal($this, customSelectSearchbox.val(), customSelectShowSelected.is(':checked'))
                        })
                    }
                    // show only selected options
                    customSelectShowSelected.bind('click.customSelect',function(){
                        if(config.extendedSearch){
                            customSelectSearchbox.trigger('keyup');
                        }
                    })

                    // after all is done replace ajax loader with custom select
                    ajaxLoader.replaceWith(customSelect);
                }
            });
        },
        destroy : function(  ) {
            return this.each(function(){
                var $this = $(this);
                var data = $this.data('customSelect');
                var customSelectContainer = $this.closest('.'+data.config.customSelectContainerClass);
                customSelectContainer.find('.'+data.config.customSelectListContainerClass).unbind('.customSelect');
                $this.unbind('.customSelect');
                $('body').unbind('.customSelect');
                $this.removeData('customSelect');
                customSelectContainer.replaceWith($this).remove();
            })

        },
        update : function(  ) {
        // ...
        },
        disable : function( select ) {
            if (select === undefined){
                select = this
            }
            return select.each(function(){
                var $this = $(this);
                var data = $this.data('customSelect');
                if(data){
                    data.customSelect.addClass(data.config.disabledClass)
                }
                $this.attr('disabled','disabled')
            })
        },
        enable : function( select ) {
            if (select === undefined){
                select = this
            }
            return select.each(function(){
                var $this = $(this);
                var data = $this.data('customSelect');
                if(data){
                    data.customSelect.removeClass(data.config.disabledClass)
                }
                $this.removeAttr('disabled')
            })
        },
        synchronise : function( srcSelect ) {
            // synchronise
            var data = srcSelect.data('customSelect');
            var config = data.config;
            var selectedItemsCount = 0;
            var selectedItemIndex = false;

            for(var i = 0; i < data.options.length; i++){
                if(data.options[i].srcElement.is(':selected')){
                    data.options[i].styledElement.addClass(config.selectedClass);
                    data.options[i].styledElementInput.attr('checked','checked');
                    selectedItemsCount++;
                    selectedItemIndex = i;
                }else{
                    if(data.options[i].styledElement.hasClass(config.selectedClass)){
                        data.options[i].styledElement.removeClass(config.selectedClass);
                        data.options[i].styledElementInput.removeAttr('checked');
                    }
                }
            }
            // show/hide clear selection button
            if(selectedItemsCount > 0 && (srcSelect.attr('multiple') !== undefined || srcSelect.attr('size') !== undefined)){
                data.clearSelection.show();
            }

            // set title
            var customSelectTitle = config.placeholderText;
            if(selectedItemsCount == 1 && selectedItemIndex !== false){
                customSelectTitle = data.options[selectedItemIndex].srcElement.html();
            }
            if(selectedItemsCount > 1){
                customSelectTitle = config.multipleOptionsSelectedText.replace('#selected#', selectedItemsCount)
                .replace('#total#', data.options.length);
            }
            data.customSelectTitle.html(customSelectTitle)
        },
        clearSelection : function( select ) {
            if (select === undefined){
                select = this
            }
            return select.each(function(){
                var $this = $(this);
                var data = $this.data('customSelect');
                data.clearSelection.hide();
                if(data){
                    for(var i = 0; i < data.options.length; i++){
                        data.options[i].srcElement.removeAttr('selected');
                    }
                }
                methods.synchronise( $this );
            });
        }
    };

    $.fn.customSelect = function( method ) {

        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.cusTomSelect' );
        }

    };

    // generate custom select options
    function generateCustomSelectOptions(srcSelect, inputType)
    {
        var config = srcSelect.data('customSelect').config;

        var customSelectList = $('<div />').addClass(config.customSelectListClass);
        srcSelect.data('customSelect',$.extend(srcSelect.data('customSelect'), {
            groups : [],
            options : []
        }));
        var groups = srcSelect.data('customSelect').groups;
        var options = srcSelect.data('customSelect').options;


        // checking for groups
        if(srcSelect.find('optgroup').length > 0){
            srcSelect.find('optgroup').each(function(){
                var o = {
                    srcElement : $(this),
                    styledElement : false,
                    optionsContainer : false
                }
                groups.push(o);
            })
        }

        // checking for options
        srcSelect.find('option').each(function(){
            var group = false;
            if($(this).parent().is('optgroup')){
                group = groups[$(this).parent().index()];
            }
            var o = {
                srcElement : $(this),
                styledElement : false,
                styledElementInput : false,
                optionsContainer : false,
                group: group,
                searchString : false
            }
            options.push(o);
        })

        // updating groups
        for(var i = 0; i < groups.length; i++){
            var customSelectOptionsGroup = $('<div />').addClass(config.customSelectOptionsGroupClass);
            var customSelectOptionsGroupHeader = $('<div />').addClass(config.customSelectOptionsGroupHeaderClass);
            customSelectOptionsGroup.append(customSelectOptionsGroupHeader);
            customSelectList.append(customSelectOptionsGroup);
            groups[i].styledElement = customSelectOptionsGroup;
            // set options group header
            if(groups[i].srcElement.attr('label') !== undefined)
            {
                customSelectOptionsGroupHeader.html(groups[i].srcElement.attr('label'));
            }
        // add styled option to data
        }
        // updating options
        var customSelectOptionsList = $('<ul />').addClass(config.customSelectOptionsListClass);
        for(var i = 0; i < options.length; i++){
            var customSelectOption = $('<li />');
            options[i].styledElement = customSelectOption;

            if(options[i].group){
                if(!options[i].group.optionsContainer){
                    options[i].group.optionsContainer = customSelectOptionsList.clone();
                    options[i].group.styledElement.append(options[i].group.optionsContainer);
                }
                options[i].optionsContainer = options[i].group.optionsContainer;
            }else{
                options[i].optionsContainer = customSelectOptionsList
            }
            options[i].optionsContainer.append(customSelectOption);


            // generate search data
            options[i].searchString = options[i].srcElement.text();
            if(options[i].srcElement.attr('data-tags') !== undefined)
            {
                options[i].searchString += ' ' + options[i].srcElement.attr('data-tags');
            }

            var customSelectOptionInput = $('<input />').attr('type', inputType).attr('tabindex','-1');
            options[i].styledElementInput = customSelectOptionInput;
            var customSelectOptionLabel = $('<label />')
            .attr('title', options[i].srcElement.text())
            .append(options[i].srcElement.html());
            customSelectOption.append(customSelectOptionInput).append(customSelectOptionLabel);

            options[i].optionsContainer.append(customSelectOption);
            // bind events
            customSelectOption.bind('click.customSelect', {
                src : options[i].srcElement,
                target : customSelectOptionInput
            }, function(e){
                e.preventDefault();
                if(e.data.src.is(':selected')){
                    if(inputType == 'radio'){
                        return;
                    }
                    e.data.src.removeAttr('selected');
                }else{
                    e.data.src.attr('selected','selected');
                }
//                srcSelect.trigger('focus');
                srcSelect.trigger('change');
            })

        }
        if(groups.length < 1){
            customSelectList.append(customSelectOptionsList);
        }

        return customSelectList;


    }

    function searchLocal(srcSelect, needle, searchSelected){
        needle = needle.toString();
        var data = srcSelect.data('customSelect');
        var config = data.config;
        var options = data.options;
        var found = false;
        data.messagesContainer.html('');
        for(var i = 0; i < options.length; i++){
            var reg = new RegExp(".*"+needle+".*", "i");
            var allowSearch = true;
            if(searchSelected){
                if(!options[i].srcElement.is(':selected')){
                    allowSearch = false;
                }
            }

            if(options[i].searchString.toString().search(reg)>=0 && allowSearch)
            {
                found = true;
                options[i].styledElement.removeClass(config.customSelectOptionHidden);
            }
            else
            {
                options[i].styledElement.addClass(config.customSelectOptionHidden);
            }
        }
        if(!found){
            data.messagesContainer.html(config.messageNotFound.replace('#needle#', '<cite>' + needle + '</cite>'));
            if(searchSelected){
                if(needle == ''){
                    data.messagesContainer.html(config.messageNoItemsSelected);
                }else{
                    data.messagesContainer.html(config.messageNotFoundInSelected.replace('#needle#', '<cite>' + needle + '</cite>'));
                }
            }
        }
    }


    // generate random string
    function generateRandomString(stringLenht)
    {
        stringLenht = parseInt(stringLenht);
        var randomString = '';
        var alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
        var charPosition = 0;
        for (i = 0; i < stringLenht; i++) {
            charPosition = Math.floor(Math.random() * alphabet.length);
            randomString += alphabet.substr(charPosition, 1);
        }
        return randomString;
    }


})( jQuery );