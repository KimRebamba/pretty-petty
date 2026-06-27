$(document).ready(function () {
    const API = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    PrettyPettyUI.apiBase = API;
    PrettyPettyUI.initButtons('button');
    PrettyPettyUI.initProductSearchAutocomplete();

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

    // ── State ──
    let allProducts = [];
    let currentPage = 1;
    const perPage = 6;
    let infiniteScrollEnabled = false;
    let infiniteScrollOffset = 0;
    let infiniteScrollLoading = false;
    let infiniteScrollDone = false;

    // ── Live search: filter products ──
    let searchTimer = null;
    $('#search-input').on('keyup', function () {
        const query = $(this).val().trim().toLowerCase();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            if (query.length === 0) {
                // Reset to show all — re-render current page
                if (infiniteScrollEnabled) {
                    $('#products-container').empty();
                    infiniteScrollOffset = 0;
                    infiniteScrollDone = false;
                    loadNextBatch();
                } else {
                    renderCurrentPage();
                }
                return;
            }
            // Filter allProducts and re-render
            const filtered = allProducts.filter(function (p) {
                return p.name.toLowerCase().indexOf(query) !== -1 ||
                    (p.description && p.description.toLowerCase().indexOf(query) !== -1);
            });
            const savedAll = allProducts;
            allProducts = filtered;
            currentPage = 1;
            infiniteScrollOffset = 0;
            infiniteScrollDone = false;
            if (infiniteScrollEnabled) {
                $('#products-container').empty();
                loadNextBatch();
            } else {
                renderCurrentPage();
            }
            allProducts = savedAll;
        }, 200);
    });

    // ── Load categories into filter ──
    $.get(API + '/api/categories', function (categories) {
        const $select = $('#category-filter').find('option:first').siblings().remove().end();
        categories.forEach(function (cat) {
            $select.after($('<option></option>').val(cat.id).text(cat.name));
        });
        PrettyPettyUI.initSelectmenu('#category-filter');
    });

    // ── Fetch products ──
    function fetchProducts(categoryId, callback) {
        const url = categoryId ? API + '/api/products?category_id=' + categoryId : API + '/api/products';
        $.get(url, function (products) {
            allProducts = products;
            currentPage = 1;
            infiniteScrollOffset = 0;
            infiniteScrollDone = false;

            $('#no-results-message').hide();

            if (products.length === 0) {
                $('#products-container').empty();
                $('#pagination-controls').empty();
                $('#no-results-message').show();
                return;
            }

            if (callback) callback();
            else renderCurrentPage();
        });
    }

    // ── Pagination mode ──
    function renderCurrentPage() {
        const $container = $('#products-container').empty();
        const totalPages = Math.ceil(allProducts.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageProducts = allProducts.slice(start, start + perPage);

        pageProducts.forEach(function (p) { $container.append(buildProductCard(p)); });
        renderPagination(totalPages);
        $('#loading-indicator').hide();
    }

    function renderPagination(totalPages) {
        const $controls = $('#pagination-controls').empty();

        if (totalPages <= 1) return;

        $controls.append($('<button class="page-btn"></button>').text('Previous').data('page', currentPage - 1).prop('disabled', currentPage === 1));
        for (let i = 1; i <= totalPages; i++) {
            const btn = $('<button class="page-btn"></button>').text(i).data('page', i);
            if (i === currentPage) btn.addClass('active').css({ fontWeight: 'bold', backgroundColor: '#007bff', color: '#fff' });
            $controls.append(btn);
        }
        $controls.append($('<button class="page-btn"></button>').text('Next').data('page', currentPage + 1).prop('disabled', currentPage === totalPages));
        PrettyPettyUI.initButtons('.page-btn');
    }

    $(document).on('click', '.page-btn', function () {
        const page = $(this).data('page');
        if (page < 1 || page > Math.ceil(allProducts.length / perPage) || $(this).prop('disabled')) return;
        currentPage = page;
        renderCurrentPage();
        $('html, body').animate({ scrollTop: 0 }, 300);
    });

    // ── Infinite scroll mode ──
    function loadNextBatch() {
        if (infiniteScrollLoading || infiniteScrollDone) return;
        infiniteScrollLoading = true;
        $('#loading-indicator').show();

        const batch = allProducts.slice(infiniteScrollOffset, infiniteScrollOffset + perPage);
        setTimeout(function () {
            const $container = $('#products-container');
            if (batch.length === 0) {
                infiniteScrollDone = true;
                if ($container.children().length === 0) $('#no-results-message').show();
                $('#loading-indicator').hide();
                infiniteScrollLoading = false;
                return;
            }

            batch.forEach(function (p) { $container.append(buildProductCard(p)); });
            infiniteScrollOffset += perPage;
            if (infiniteScrollOffset >= allProducts.length) infiniteScrollDone = true;
            $('#loading-indicator').hide();
            infiniteScrollLoading = false;
        }, 200);
    }

    $(window).on('scroll', function () {
        if (!infiniteScrollEnabled) return;
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 200) {
            loadNextBatch();
        }
    });

    // ── Toggle button ──
    if ($('#toggle-scroll-mode').length === 0) {
        const $btn = $('<button id="toggle-scroll-mode"></button>').text('Switch to Infinite Scroll').css({
            margin: '10px 0', padding: '6px 14px', cursor: 'pointer'
        });
        $('#category-filter').parent().after($btn);
        PrettyPettyUI.initButtons('#toggle-scroll-mode');
    }

    $(document).on('click', '#toggle-scroll-mode', function () {
        infiniteScrollEnabled = !infiniteScrollEnabled;
        if (infiniteScrollEnabled) {
            $(this).text('Switch to Pagination');
            $('#pagination-controls').empty();
            $('#products-container').empty();
            infiniteScrollOffset = 0;
            infiniteScrollDone = false;
            loadNextBatch();
        } else {
            $(this).text('Switch to Infinite Scroll');
            renderCurrentPage();
        }
    });

    // ── Category filter ──
    $('#category-filter').on('change', function () {
        const catId = $(this).val();
        fetchProducts(catId || '', function () {
            if (infiniteScrollEnabled) {
                $('#products-container').empty();
                infiniteScrollOffset = 0;
                infiniteScrollDone = false;
                loadNextBatch();
            } else {
                renderCurrentPage();
            }
        });
    });

    // ── Helper: build product card ──
    function buildProductCard(product) {
        const images = product.Product_Images || [];
        const imgSrc = images.length > 0 ? images[0].image_path : '/uploads/placeholder.jpg';
        const outOfStock = !product.stock || product.stock <= 0;

        const card = $('<div class="product-card"></div>').css({
            display: 'inline-block', width: '220px', margin: '10px',
            verticalAlign: 'top', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', textAlign: 'center'
        });

        if (outOfStock) {
            // No link on image for out-of-stock
            card.append($('<img>').attr({ src: imgSrc, alt: product.name }).css({ width: '200px', height: '180px', objectFit: 'cover' }));
            card.append($('<span></span>').text('Out of Stock').css({
                display: 'inline-block', backgroundColor: '#e74c3c', color: '#fff',
                padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginTop: '6px'
            }));
        } else {
            card.append($('<a></a>', { href: 'product_details.html?id=' + product.id }).append(
                $('<img>').attr({ src: imgSrc, alt: product.name }).css({ width: '200px', height: '180px', objectFit: 'cover' })
            ));
        }

        card.append($('<h3></h3>').text(product.name));
        card.append($('<p></p>').text('$' + parseFloat(product.price).toFixed(2)));

        // Average rating
        if (product.Reviews && product.Reviews.length > 0) {
            var avgRating = product.Reviews.reduce(function(sum, r) { return sum + r.rating; }, 0) / product.Reviews.length;
            var starsHtml = '';
            for (var s = 1; s <= 5; s++) {
                starsHtml += s <= Math.round(avgRating) ? '\u2605' : '\u2606';
            }
            card.append($('<p></p>').html('<span style="color: #f59e0b;">' + starsHtml + '</span> <small>(' + product.Reviews.length + ' reviews)</small>'));
        }

        if (isLoggedIn) {
            if (outOfStock) {
                card.append($('<button class="add-to-cart-btn"></button>').text('Add to Cart')
                    .data('product-id', product.id)
                    .prop('disabled', true)
                    .css({ marginTop: '8px', padding: '6px 12px', cursor: 'not-allowed', opacity: 0.5 })
                );
            } else {
                card.append($('<button class="add-to-cart-btn"></button>').text('Add to Cart')
                    .data('product-id', product.id)
                    .css({ marginTop: '8px', padding: '6px 12px', cursor: 'pointer' })
                );
            }
        }

        // Wrap entire card in <a> for in-stock products
        if (!outOfStock) {
            const link = $('<a></a>', {
                href: 'product_details.html?id=' + product.id,
                css: { textDecoration: 'none', color: 'inherit' }
            });
            card.wrap(link);
        }

        return card;
    }

    // ── Add to Cart (delegated) ──
    $(document).on('click', '.add-to-cart-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!localStorage.getItem('token')) { window.location.href = '/login.html'; return; }
        const pid = $(this).data('product-id');
        $.ajax({
            url: API + '/api/cart',
            method: 'POST',
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
            data: JSON.stringify({ product_id: pid, quantity: 1 }),
            success: function () { alert('Added to cart!'); loadCartCount(); },
            error: function (xhr) { alert((xhr.responseJSON && xhr.responseJSON.message) || 'Failed to add to cart.'); }
        });
    });

    // ── Initial load ──
    fetchProducts('');
});
