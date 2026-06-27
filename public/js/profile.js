$(document).ready(function () {
    const API = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // If not logged in, show message and hide form
    if (!token || !user.id) {
        $('#not-logged-in').show();
        $('#profile-content').hide();
        $('#user-bar').hide();
        return;
    }

    PrettyPettyUI.initButtons('button, input[type="submit"]');

    // User bar
    if (user.first_name || user.last_name) {
        $('#user-display-name').text('Hi, ' + (user.first_name || '') + ' ' + (user.last_name || ''));
    }
    if (user.image_path) $('#user-avatar').attr('src', user.image_path);
    $('#user-bar').css('display', 'flex');
    $('#nav-auth').hide();
    $('#nav-user').css('display', 'inline');

    // Logout
    $('#logout-link').on('click', function (e) {
        e.preventDefault();
        if (token) {
            $.ajax({ url: API + '/api/auth/logout', method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
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
                $('#user-display-name').text('Hi, ' + (updatedUser.first_name || '') + ' ' + (updatedUser.last_name || ''));
                $('#user-avatar').attr('src', updatedUser.image_path || '/uploads/default.png');
                setTimeout(function () { $('#profile-success').text(''); }, 3000);
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to update profile.';
                $('#profile-error').text(msg);
            }
        });
    });
});
