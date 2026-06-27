$(document).ready(function () {
    var API = 'http://localhost:3000';
    var token = localStorage.getItem('token');
    var user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        window.location.href = '/index.html?msg=login_required';
        return;
    }

    PrettyPettyUI.initButtons('button');

    // ── Alert banner ──
    (function() {
        const params = new URLSearchParams(window.location.search);
        const msg = params.get('msg');
        if (msg) {
            const $b = $('#alert-banner');
            let text = '';
            if (msg === 'login_required') text = 'You need to be logged in to access that page. <a href="login.html">Log in</a> or <a href="register.html">create an account</a>.';
            else if (msg === 'admin_required') text = 'You do not have permission to access that page.';
            else if (msg === 'access_denied') text = 'Access denied.';
            else text = msg;
            $b.html(text).slideDown(200);
            window.history.replaceState({}, '', window.location.pathname);
        }
    })();

    // ── User state ──
    function initUserState() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const t = localStorage.getItem('token');
        if (t && user && user.id) {
            $('#nav-auth-links').hide();
            $('#nav-user').css('display', 'flex');
            $('.nav-auth-only').show();
            $('#nav-categories-link').hide();
            const fullName = (user.first_name || '') + ' ' + (user.last_name || '');
            $('#user-display-name').text(fullName);
            if (user.image_path) $('#user-avatar').attr('src', user.image_path);
            if (user.role === 'admin') {
                $('#nav-home-link').attr('href', '/admin/dashboard.html').text('Admin');
            }
        } else {
            $('#nav-auth-links').show();
            $('#nav-user').hide();
            $('.nav-auth-only').hide();
            $('#nav-categories-link').show();
        }
    }
    initUserState();

    function loadCartCount() {
        $.ajax({
            url: API + '/api/cart', method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                var items = (data && data.Cart_Items) ? data.Cart_Items : [];
                var total = 0;
                items.forEach(function (i) { total += (i.quantity || 0); });
                $('.cart-count').text(total);
            },
            error: function () { $('.cart-count').text('0'); }
        });
    }
    loadCartCount();

    $(document).on('click', '#logout-link', function (e) {
        e.preventDefault();
        if (token) {
            $.ajax({ url: API + '/api/auth/logout', method: 'POST', headers: { Authorization: 'Bearer ' + token } });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html?msg=login_required';
    });

    function loadReviews() {
        $.ajax({
            url: API + '/api/reviews/my',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (reviews) {
                $('#reviews-loading').hide();

                if (!reviews || reviews.length === 0) {
                    $('#reviews-empty').show();
                    $('#reviews-list').empty();
                    return;
                }

                $('#reviews-empty').hide();
                var html = '';
                reviews.forEach(function (review) {
                    var stars = '';
                    for (var i = 1; i <= 5; i++) {
                        stars += i <= review.rating ? '★' : '☆';
                    }

                    var productName = review.Product ? review.Product.name : 'Unknown Product';
                    var date = review.created_at ? new Date(review.created_at).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                    var verifiedBadge = review.verified_at ? ' <span style="color: green; font-size: 12px;">✓ Verified</span>' : ' <span style="color: #888; font-size: 12px;">Pending verification</span>';
                    var actions = review.verified_at
                        ? '<span style="color: #888; font-size: 13px;">Verified reviews cannot be edited</span>'
                        : '<a href="review.html?id=' + review.id + '" style="margin-right: 15px;">Edit</a>' +
                          '<button class="delete-review-btn" data-review-id="' + review.id + '" style="color: red; background: none; border: none; cursor: pointer; padding: 0;">Delete</button>';

                    html += '<div class="review-card" data-review-id="' + review.id + '" style="border: 1px solid #ccc; border-radius: 8px; padding: 15px; margin-bottom: 15px;">' +
                        '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                        '<h3 style="margin: 0;"><a href="product_details.html?id=' + review.product_id + '">' + productName + '</a></h3>' +
                        '<span style="color: #666; font-size: 13px;">' + date + '</span>' +
                        '</div>' +
                        '<div style="color: #f59e0b; font-size: 18px;">' + stars + verifiedBadge + '</div>' +
                        '<p style="margin-top: 8px;">' + (review.comment || 'No comment') + '</p>' +
                        '<div style="margin-top: 10px;">' + actions + '</div>' +
                        '</div>';
                });

                $('#reviews-list').html(html);
            },
            error: function () {
                $('#reviews-loading').text('Failed to load reviews.');
            }
        });
    }

    $(document).on('click', '.delete-review-btn', function () {
        var reviewId = $(this).data('review-id');
        var $card = $(this).closest('.review-card');

        PrettyPettyUI.confirm('Delete this review? This cannot be undone.', function () {
            $.ajax({
                url: API + '/api/reviews/' + reviewId,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function () {
                    $card.fadeOut(300, function () {
                        $(this).remove();
                        if ($('#reviews-list .review-card').length === 0) {
                            $('#reviews-empty').show();
                        }
                    });
                },
                error: function (xhr) {
                    var msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to delete review.';
                    alert(msg);
                }
            });
        });
    });

    loadReviews();
});
