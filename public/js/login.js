$(document).ready(function () {
    const API = 'http://localhost:3000';

    // ── Alert banner ──
    (function() {
        const params = new URLSearchParams(window.location.search);
        const msg = params.get('msg');
        if (msg) {
            const $b = $('#alert-banner');
            let text = '';
            if (msg === 'login_required') text = 'You need to be logged in to access that page. <a href="login.html">Log in</a> or <a href="register.html">create an account</a>.';
            else if (msg === 'admin_required') text = 'You do not have permission to access that page. Admin access required.';
            else if (msg === 'access_denied') text = 'Access denied.';
            else text = msg;
            $b.html(text).slideDown(200);
            window.history.replaceState({}, '', window.location.pathname);
        }
    })();

    PrettyPettyUI.initButtons('button, input[type="submit"]');

    // Check URL params for messages (e.g., ?msg=access_denied)
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('msg');
    if (msg === 'access_denied') {
        $('#login-message').text('Access denied. Please log in with an admin account.').show();
    }

    // If already logged in, redirect
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.role === 'admin') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/index.html';
            }
            return;
        } catch (e) {
            // corrupted user data, clear and continue
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    // Submit login form
    $('#login-form').on('submit', function (e) {
        e.preventDefault();

        const email = $('#email').val().trim();
        const password = $('#password').val();
        const $error = $('#general-error');

        // Clear all errors
        $('.error-text').text('');
        $error.text('').hide();

        // Client-side validation
        let hasError = false;

        if (!email) {
            $('#email-error').text('Email is required.');
            hasError = true;
        }

        if (!password) {
            $('#password-error').text('Password is required.');
            hasError = true;
        }

        if (hasError) {
            PrettyPettyUI.shake('#login-form');
            return;
        }

        $.ajax({
            url: API + '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function (res) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));

                if (res.user.role === 'admin') {
                    window.location.href = '/admin/dashboard.html';
                } else {
                    window.location.href = '/index.html';
                }
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Login failed. Please try again.';
                $error.text(msg).show();
                PrettyPettyUI.shake('#login-form');
            }
        });
    });
});
