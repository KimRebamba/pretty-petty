$(document).ready(function () {
    const API = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        $('#p-name').text('No product specified.');
        return;
    }

    // ── User bar ──
    function initUserBar() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (token && user && user.id) {
            $('#nav-auth').hide();
            $('#nav-user').css('display', 'inline');
            const fullName = (user.first_name || '') + ' ' + (user.last_name || '');
            $('#user-display-name').text('Hi, ' + fullName);
            if (user.image_path) $('#user-avatar').attr('src', user.image_path);
            $('#user-bar').css('display', 'flex');
            if (user.role === 'admin') {
                $('#user-bar').append('<a href="/admin/dashboard.html" style="margin-left: 10px;">Admin Panel</a>');
            }
        }
    }
    initUserBar();

    // ── Cart count ──
    function loadCartCount() {
        const t = localStorage.getItem('token');
        if (!t) { $('.cart-count').text('0'); return; }
        $.ajax({
            url: API + '/api/cart',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + t },
            success: function (data) {
                const items = (data && data.Cart_Items) ? data.Cart_Items : [];
                let total = 0;
                items.forEach(function (i) { total += (i.quantity || 0); });
                $('.cart-count').text(total);
            },
            error: function () { $('.cart-count').text('0'); }
        });
    }
    loadCartCount();

    // ── Logout handler ──
    $(document).on('click', '#logout-link', function (e) {
        e.preventDefault();
        if (token) {
            $.ajax({
                url: API + '/api/auth/logout',
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    // ── Live search: filter products ──
    let searchTimer = null;
    $('#search-input').on('keyup', function () {
        const query = $(this).val().trim().toLowerCase();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            // On product details page, redirect to products page with search query
            if (query.length > 0) {
                window.location.href = 'products.html?search=' + encodeURIComponent(query);
            }
        }, 200);
    });

    // ── Load product ──
    $.get(API + '/api/products/' + productId, function (product) {
        const images = product.Product_Images || [];
        const imgSrc = images.length > 0 ? images[0].image_path : '/uploads/placeholder.jpg';

        $('#p-main-img').attr('src', imgSrc);
        $('#p-name').text(product.name);
        $('#p-category').text(product.Category ? product.Category.name : '');
        $('#p-price').text('$' + parseFloat(product.price).toFixed(2));
        $('#p-stock').text('Stock: ' + product.stock);
        $('#p-description').text(product.description || '');
        $('#p-id').val(product.id);

        // Out-of-stock handling
        if (!product.stock || product.stock <= 0) {
            $('#p-stock').text('Out of Stock').css({ color: '#e74c3c', fontWeight: 'bold' });
            // Disable the add-to-cart form
            const $form = $('#add-to-cart-form');
            $form.find('button[type="submit"]').prop('disabled', true).css({ opacity: 0.5, cursor: 'not-allowed' });
            $form.find('input[name="quantity"]').prop('disabled', true);
            $form.prepend($('<p></p>').text('This product is currently out of stock.').css({ color: '#e74c3c', fontWeight: 'bold', marginBottom: '8px' }));
        }

        // Thumbnails
        const $thumbs = $('#product-thumbnails').empty();
        images.forEach(function (img, i) {
            const thumb = $('<img>').attr({
                src: img.image_path,
                alt: product.name + ' ' + (i + 1),
                'data-img-path': img.image_path
            }).addClass('thumbnail').css({
                width: '80px', height: '80px', objectFit: 'cover',
                cursor: 'pointer', margin: '4px', border: i === 0 ? '3px solid #007bff' : '3px solid #ccc'
            });
            $thumbs.append(thumb);
        });

        $(document).on('click', '.thumbnail', function () {
            const src = $(this).attr('data-img-path');
            $('#p-main-img').attr('src', src);
            $('.thumbnail').css('border-color', '#ccc');
            $(this).css('border-color', '#007bff');
        });
    });

    // ── Add to cart ──
    $('#add-to-cart-form').on('submit', function (e) {
        e.preventDefault();
        if (!isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // Out-of-stock check
        const stockText = $('#p-stock').text();
        if (stockText.indexOf('Out of Stock') !== -1) {
            return;
        }

        $('#cart-error').text('');
        $('#cart-success').text('');

        const qty = parseInt($('#quantity').val(), 10) || 1;
        $.ajax({
            url: API + '/api/cart',
            method: 'POST',
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + token },
            data: JSON.stringify({ product_id: productId, quantity: qty }),
            success: function () {
                $('#cart-success').text('Added to cart!');
                loadCartCount();
                setTimeout(function () { $('#cart-success').text(''); }, 3000);
            },
            error: function (xhr) {
                $('#cart-error').text((xhr.responseJSON && xhr.responseJSON.message) || 'Failed to add to cart.');
            }
        });
    });

    // ── Load reviews (read-only) ──
    function loadReviews() {
        $.get(API + '/api/reviews?product_id=' + productId, function (reviews) {
            const $container = $('#reviews-list-container').empty();
            if (!reviews || reviews.length === 0) {
                $container.append('<p id="no-reviews-message">No reviews yet.</p>');
                return;
            }
            reviews.forEach(function (r) {
                const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                const verified = r.verified_at ? ' <span style="color: green; font-size: 12px;">✓ Verified</span>' : '';
                const div = $('<div class="review-item"></div>').css({ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' });
                div.append($('<p></p>').html('<strong>' + (r.User ? r.User.first_name + ' ' + r.User.last_name : 'Anonymous') + '</strong> - <span>Rating: ' + stars + ' (' + r.rating + '/5)</span>' + verified));
                div.append($('<p></p>').text(r.comment));
                const date = new Date(r.created_at);
                div.append($('<small></small>').text('Reviewed on: ' + date.toLocaleDateString()));
                $container.append(div);
            });
        });
    }
    loadReviews();
});
