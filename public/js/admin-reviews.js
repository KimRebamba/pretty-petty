$(document).ready(function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
        window.location.href = '/index.html?msg=admin_required';
        return;
    }

    (function() {
        const params = new URLSearchParams(window.location.search);
        const msg = params.get('msg');
        if (msg) {
            const $banner = $('#alert-banner');
            let text = msg.replace(/_/g, ' ');
            $banner.text(text).show();
            setTimeout(function() { $banner.slideUp(); }, 5000);
            if (window.history.replaceState) {
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    })();

    function initUserState() {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const t = localStorage.getItem('token');
        if (t && u && u.id) {
            $('#nav-user').css('display', 'flex');
            const fullName = (u.first_name || '') + ' ' + (u.last_name || '');
            $('#user-display-name').text(fullName || 'Admin');
            if (u.image_path) $('#user-avatar').attr('src', u.image_path);
        }
    }
    initUserState();

    $('#logout-link').on('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    const API = PrettyPettyUI.apiBase;

    PrettyPettyUI.initButtons('#logout-link, #back-to-list-btn, #verify-review-btn');

    $('#review-tabs').tabs({ disabled: [1] });

    let reviewsTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function renderStars(rating) {
        const r = parseInt(rating) || 0;
        return '\u2605'.repeat(r) + '\u2606'.repeat(5 - r) + ' (' + r + '/5)';
    }

    function loadReviews() {
        const includeDeleted = $('#include-deleted').is(':checked');
        let url = API + '/api/reviews';
        if (includeDeleted) url += '?includeDeleted=true';

        $.ajax({
            url: url,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                const reviews = (Array.isArray(res) ? res : []).map(function(r) {
                    const customer = r.User ? r.User.first_name + ' ' + r.User.last_name : 'User #' + (r.user_id || '-');
                    const product = r.Product ? r.Product.name : 'Product #' + (r.product_id || '-');
                    const verified = !!r.verified_at;
                    const isDeleted = !!r.deleted_at;
                    let actions = '';
                    if (isDeleted) {
                        actions = '<button class="restore-btn" data-id="' + r.id + '">Restore</button>';
                    } else {
                        actions = '<button class="view-btn" data-id="' + r.id + '">View</button>';
                        // if (!verified) {
                        //     actions += ' <button class="verify-btn" data-id="' + r.id + '">Verify</button>';
                        // }
                    }
                    return {
                        DT_RowId: 'row_' + r.id,
                        DT_RowClass: isDeleted ? 'deleted-row' : '',
                        id: r.id,
                        customer: customer,
                        product: product,
                        rating: renderStars(r.rating),
                        comment: r.comment || '-',
                        status: isDeleted ? 'Deleted' : (verified ? 'Verified' : 'Pending'),
                        date: formatDate(r.created_at),
                        actions: actions
                    };
                });
                if (reviewsTable) { reviewsTable.destroy(); }
                reviewsTable = $('#reviews-table').DataTable({
                    data: reviews,
                    destroy: true,
                    columns: [
                        { data: null, orderable: false, render: function(d) {
                            return '<input type="checkbox" class="row-checkbox" data-id="' + d.id + '">';
                        }},
                        { data: 'id' },
                        { data: 'customer' },
                        { data: 'product' },
                        { data: 'rating', orderable: false },
                        { data: 'comment' },
                        { data: 'status' },
                        { data: 'date' },
                        { data: 'actions', orderable: false }
                    ]
                });
                $('#select-all').prop('checked', false);
                updateBulkUI();
            },
            error: function() { $('#list-error').text('Failed to load reviews.'); }
        });
    }

    $(document).on('change', '#select-all', function() {
        $('.row-checkbox').prop('checked', this.checked);
        updateBulkUI();
    });

    $(document).on('change', '.row-checkbox', function() {
        updateBulkUI();
    });

    function updateBulkUI() {
        const checked = $('.row-checkbox:checked').length;
        $('#selected-count').text(checked);
        $('#bulk-delete-btn').toggle(checked > 0);
    }

    $('#include-deleted').on('change', function() { loadReviews(); });

    $('#bulk-delete-btn').on('click', function() {
        const ids = $('.row-checkbox:checked').map(function() { return $(this).data('id'); }).get();
        if (!ids.length) return;
        PrettyPettyUI.confirm('Delete ' + ids.length + ' selected review(s)? This is a soft delete.', function() {
            $.ajax({
                url: API + '/api/reviews/bulk',
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
                data: JSON.stringify({ ids: ids }),
                success: function() {
                    PrettyPettyUI.flashMessage('#list-success', ids.length + ' review(s) deleted.', 'success');
                    $('#list-error').text('');
                    loadReviews();
                    updateBulkUI();
                },
                error: function(xhr) {
                    PrettyPettyUI.flashMessage('#list-error', xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Bulk delete failed.', 'error');
                    $('#list-success').text('');
                }
            });
        });
    });

    $(document).on('click', '.restore-btn', function() {
        const id = $(this).data('id');
        PrettyPettyUI.confirm('Restore this review?', function() {
            $.ajax({
                url: API + '/api/reviews/' + id + '/restore',
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    PrettyPettyUI.flashMessage('#list-success', 'Review restored.', 'success');
                    $('#list-error').text('');
                    loadReviews();
                },
                error: function(xhr) {
                    PrettyPettyUI.flashMessage('#list-error', xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Restore failed.', 'error');
                    $('#list-success').text('');
                }
            });
        });
    });

    function deleteReview(id, onSuccess) {
        PrettyPettyUI.confirm('Delete this review? This is a soft delete.', function() {
            $.ajax({
                url: API + '/api/reviews/' + id,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    if (typeof onSuccess === 'function') onSuccess();
                },
                error: function(xhr) {
                    const msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Failed to delete review.';
                    PrettyPettyUI.flashMessage('#list-error', msg, 'error');
                }
            });
        });
    }

    function verifyReview(id, successSelector) {
        $.ajax({
            url: API + '/api/reviews/' + id + '/verify',
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token },
            success: function() {
                PrettyPettyUI.flashMessage(successSelector || '#list-success', 'Review verified successfully!', 'success');
                loadReviews();
            },
            error: function() {
                PrettyPettyUI.flashMessage(successSelector === '#detail-success' ? '#detail-error' : '#list-error', 'Failed to verify review.', 'error');
            }
        });
    }

    $(document).on('click', '.verify-btn', function() {
        verifyReview($(this).data('id'), '#list-success');
    });

    $(document).on('click', '.view-btn', function() {
        const id = $(this).data('id');
        $.ajax({
            url: API + '/api/reviews/' + id,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(r) {
                const customer = r.User ? r.User.first_name + ' ' + r.User.last_name : 'User #' + (r.user_id || '-');
                const product = r.Product ? r.Product.name : 'Product #' + (r.product_id || '-');
                const verified = !!r.verified_at;

                $('#detail-id').text(r.id);
                $('#detail-customer').text(customer);
                $('#detail-product').text(product);
                $('#detail-rating').html(renderStars(r.rating));
                $('#detail-status').text(verified ? 'Verified' : 'Pending');
                $('#detail-date').text(formatDate(r.created_at));
                $('#detail-comment').text(r.comment || '-');

                if (verified) {
                    $('#verify-review-btn').hide();
                } else {
                    $('#verify-review-btn').show();
                }

                $('#detail-success').text('');
                $('#detail-error').text('');

                $('#review-tabs').tabs('enable', 1);
                $('#review-tabs').tabs('option', 'active', 1);
            },
            error: function() { $('#list-error').text('Failed to load review details.'); }
        });
    });

    $(document).on('click', '#verify-review-btn', function() {
        const id = $('#detail-id').text();
        verifyReview(id, '#detail-success');
        $('#verify-review-btn').hide();
        $('#detail-status').text('Verified');
    });

    $('#detail-delete-btn').on('click', function() {
        const id = $('#detail-id').text();
        if (!id || id === '-') return;
        deleteReview(id, function() {
            $('#review-tabs').tabs('option', 'active', 0);
            $('#review-tabs').tabs('disable', 1);
            PrettyPettyUI.flashMessage('#list-success', 'Review deleted.', 'success');
            loadReviews();
        });
    });

    $('#back-to-list-btn').on('click', function() {
        $('#review-tabs').tabs('option', 'active', 0);
        $('#review-tabs').tabs('disable', 1);
    });

    loadReviews();
});
