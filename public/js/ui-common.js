(function ($) {
    'use strict';

    const DEFAULT_API = 'http://localhost:3000';

    function ensureConfirmDialog() {
        if ($('#pp-confirm-dialog').length) {
            return $('#pp-confirm-dialog');
        }
        return $('<div id="pp-confirm-dialog" style="display:none;"><p id="pp-confirm-message"></p></div>')
            .appendTo('body');
    }

    window.PrettyPettyUI = {
        apiBase: DEFAULT_API,

        initButtons: function (selector) {
            const $targets = $(selector || 'button, input[type="submit"]');
            $targets.each(function () {
                const $el = $(this);
                if ($el.hasClass('ui-button') || $el.closest('.dataTables_wrapper').length) {
                    return;
                }
                try {
                    $el.button();
                } catch (e) {
                    // Skip elements that cannot be buttonized
                }
            });
        },

        initSelectmenu: function (selector) {
            $(selector || 'select').each(function () {
                const $el = $(this);
                if ($el.hasClass('ui-selectmenu-hidden') || $el.closest('.dataTables_wrapper').length) {
                    return;
                }
                try {
                    $el.selectmenu({ width: null });
                } catch (e) {
                    // Skip unsupported selects
                }
            });
        },

        refreshSelectmenu: function (selector) {
            $(selector || 'select').each(function () {
                const $el = $(this);
                if ($el.selectmenu('instance')) {
                    $el.selectmenu('refresh');
                } else {
                    try {
                        $el.selectmenu({ width: null });
                    } catch (e) {
                        // Skip unsupported selects
                    }
                }
            });
        },

        initProductSearchAutocomplete: function (options) {
            options = options || {};
            const $input = $('#search-input');
            if (!$input.length) {
                return;
            }

            const api = options.apiBase || this.apiBase;

            if ($input.autocomplete('instance')) {
                $input.autocomplete('destroy');
            }

            $input.autocomplete({
                minLength: 2,
                delay: 300,
                source: function (request, response) {
                    $.ajax({
                        url: api + '/api/search',
                        data: { q: request.term },
                        success: function (data) {
                            response($.map(Array.isArray(data) ? data : [], function (item) {
                                const price = parseFloat(item.price || 0).toFixed(2);
                                const category = item.category_name ? ' (' + item.category_name + ')' : '';
                                return {
                                    label: item.name + category + ' — $' + price,
                                    value: item.name,
                                    id: item.id,
                                    item: item
                                };
                            }));
                        },
                        error: function () {
                            response([]);
                        }
                    });
                },
                select: function (event, ui) {
                    if (typeof options.onSelect === 'function') {
                        options.onSelect(ui.item);
                    } else {
                        window.location.href = 'product_details.html?id=' + ui.item.id;
                    }
                    return false;
                }
            });
        },

        confirm: function (message, onConfirm) {
            const $dialog = ensureConfirmDialog();
            $('#pp-confirm-message').text(message);

            if ($dialog.dialog('instance')) {
                $dialog.dialog('destroy');
            }

            $dialog.dialog({
                modal: true,
                resizable: false,
                width: 420,
                title: 'Please Confirm',
                buttons: {
                    Cancel: function () {
                        $(this).dialog('close');
                    },
                    Confirm: function () {
                        $(this).dialog('close');
                        if (typeof onConfirm === 'function') {
                            onConfirm();
                        }
                    }
                }
            });
        },

        flashMessage: function (selector, message, type) {
            const $el = $(selector);
            if (!$el.length) {
                return;
            }

            $el.stop(true, true)
                .removeClass('ui-state-error ui-state-highlight ui-state-active')
                .addClass(type === 'error' ? 'ui-state-error' : 'ui-state-highlight')
                .text(message)
                .show()
                .effect('highlight', {}, 600);
        },

        shake: function (selector) {
            $(selector).effect('shake', { times: 2, distance: 6 }, 400);
        }
    };
})(jQuery);
