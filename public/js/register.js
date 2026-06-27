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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    $('#register-form').on('submit', function (e) {
        e.preventDefault();
        $('.error-text').text('');
        $('#general-error').text('').hide();

        const formData = new FormData(this);
        const password = formData.get('password');
        const confirmPassword = $('#password_confirmation').val();

        // Client-side validation
        const firstName = $('#first_name').val().trim();
        const lastName = $('#last_name').val().trim();
        const email = $('#email').val().trim();

        if (!firstName || !lastName || !email || !password) {
            $('#general-error').text('Please fill in all required fields.').show();
            PrettyPettyUI.shake('#register-form');
            return;
        }

        if (password !== confirmPassword) {
            $('#password_confirmation-error').text('Passwords do not match.');
            PrettyPettyUI.shake('#register-form');
            return;
        }

        if (password.length < 6) {
            $('#password-error').text('Password must be at least 6 characters.');
            PrettyPettyUI.shake('#register-form');
            return;
        }

        $.ajax({
            url: API + '/api/auth/register',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (res) {
                alert('Registration successful! Please log in.');
                window.location.href = '/login.html';
            },
            error: function (xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Registration failed.';
                $('#general-error').text(msg).show();
            }
        });
    });
});
