$(document).ready(function () {
    const API = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        window.location.href = '/index.html?msg=login_required';
        return;
    }
 PrettyPettyUI.initButtons('#logout-link');
    PrettyPettyUI.initButtons('button, input[type="submit"]');

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

    // Logout
    $(document).on('click', '#logout-link', function (e) {
        e.preventDefault();
        if (token) {
            $.ajax({ url: API + '/api/auth/logout', method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html?msg=login_required';
    });

    // ── Cart count ──
    function loadCartCount() {
        if (!token) { $('.cart-count').text('0'); return; }
        $.ajax({
            url: API + '/api/cart',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
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

    // Load profile data
    $.ajax({
        url: API + '/api/profile',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function (profile) {
            $('#first_name').val(profile.first_name || '');
            $('#last_name').val(profile.last_name || '');
            $('#email').val(profile.email || '');
            $('#delivery_address').val(profile.delivery_address || '');
            $('#user-role').text((profile.role || 'customer').charAt(0).toUpperCase() + (profile.role || 'customer').slice(1));
            $('#user-status').text((profile.status || 'active').charAt(0).toUpperCase() + (profile.status || 'active').slice(1));
            if (profile.image_path) $('#current-avatar').attr('src', profile.image_path);
            if (profile.created_at) {
                $('#user-created').text(new Date(profile.created_at).toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' }));
            }
        },
        error: function () {
            $('#profile-error').text('Failed to load profile.');
        }
    });

    // Save profile
    $('#profile-form').on('submit', function (e) {
        e.preventDefault();
        $('#profile-success').text('');
        $('#profile-error').text('');

        const firstName = $('#first_name').val().trim();
        const lastName = $('#last_name').val().trim();

        if (!firstName) { $('#first_name-error').text('First name is required.'); return; }
        if (!lastName) { $('#last_name-error').text('Last name is required.'); return; }

        const formData = new FormData(this);
        // Remove the disabled email field from FormData
        formData.delete('email');

        $.ajax({
            url: API + '/api/profile',
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            data: formData,
            processData: false,
            contentType: false,
            success: function (updatedUser) {
                $('#profile-success').text('Profile updated successfully!');
                // Update localStorage
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Update avatar
                if (updatedUser.image_path) $('#current-avatar').attr('src', updatedUser.image_path);
                // Update user bar
                initUserState();
                setTimeout(function () { $('#profile-success').text(''); }, 3000);
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to update profile.';
                $('#profile-error').text(msg);
            }
        });
    });
});
