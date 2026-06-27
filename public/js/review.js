$(document).ready(function () {
    var API = 'http://localhost:3000';
    var token = localStorage.getItem('token');
    var user = JSON.parse(localStorage.getItem('user') || '{}');

    var urlParams = new URLSearchParams(window.location.search);
    var reviewId = urlParams.get('id');
    var productId = urlParams.get('product_id');
    var isEditMode = !!reviewId;

    if (!token || !user.id) {
        $('#review-loading').hide();
        $('#not-logged-in').show();
        return;
    }

    PrettyPettyUI.initButtons('button, input[type="submit"]');
    PrettyPettyUI.initSelectmenu('#rating');

    // User bar
    if (user.first_name || user.last_name) {
        $('#user-display-name').text('Hi, ' + (user.first_name || '') + ' ' + (user.last_name || ''));
    }
    if (user.image_path) $('#user-avatar').attr('src', user.image_path);
    $('#user-bar').css('display', 'flex');
    $('#nav-auth').hide();
    $('#nav-user').css('display', 'inline');

    function loadCartCount() {
        $.ajax({
            url: API + '/api/cart',
            method: 'GET',
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
        window.location.href = '/login.html';
    });

    function showForm() {
        $('#review-loading').hide();
        $('#review-content').show();
    }

    function fail(message) {
        $('#review-loading').html('<p style="color: red;">' + message + '</p><p><a href="profile-orders.html">Back to My Orders</a></p>');
    }

    if (isEditMode) {
        $('#review-page-title').text('Edit Review');
        $('#submit-review-btn').text('Save Changes');
        $('a[href="profile-orders.html"]').attr('href', 'profile-reviews.html').text('Back to My Reviews');

        $.ajax({
            url: API + '/api/reviews/' + reviewId,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (review) {
                if (review.verified_at) {
                    fail('This review has been verified and can no longer be edited.');
                    return;
                }
                $('#review-id').val(review.id);
                $('#product-id').val(review.product_id);
                $('#rating').val(String(review.rating));
                $('#comment').val(review.comment || '');
                $('#review-product-name').text(review.Product ? review.Product.name : 'Product');
                showForm();
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to load review.';
                fail(msg);
            }
        });
    } else if (productId) {
        $.ajax({
            url: API + '/api/products/' + productId,
            method: 'GET',
            success: function (product) {
                $('#product-id').val(product.id);
                $('#review-product-name').text(product.name);
                showForm();
            },
            error: function () {
                fail('Product not found.');
            }
        });
    } else {
        fail('No product specified. Go to My Orders to review an item.');
    }

    $('#review-form').on('submit', function (e) {
        e.preventDefault();
        $('#review-error').text('');
        $('#review-success').text('');
        $('#rating-error').text('');
        $('#comment-error').text('');

        var rating = parseInt($('#rating').val(), 10);
        var comment = $('#comment').val().trim();

        if (!rating) {
            $('#rating-error').text('Please select a rating.');
            return;
        }
        if (!comment) {
            $('#comment-error').text('Please enter a comment.');
            return;
        }

        var payload = { rating: rating, comment: comment };
        var ajaxOptions;

        if (isEditMode) {
            ajaxOptions = {
                url: API + '/api/reviews/' + reviewId,
                method: 'PUT',
                data: JSON.stringify(payload)
            };
        } else {
            payload.product_id = parseInt($('#product-id').val(), 10);
            ajaxOptions = {
                url: API + '/api/reviews',
                method: 'POST',
                data: JSON.stringify(payload)
            };
        }

        $.ajax({
            url: ajaxOptions.url,
            method: ajaxOptions.method,
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + token },
            data: ajaxOptions.data,
            success: function () {
                $('#review-success').text(isEditMode ? 'Review updated!' : 'Review submitted!');
                setTimeout(function () {
                    window.location.href = isEditMode ? 'profile-reviews.html' : 'profile-orders.html';
                }, 1200);
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to save review.';
                $('#review-error').text(msg);
            }
        });
    });
});
