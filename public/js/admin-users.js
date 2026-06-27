$(document).ready(function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user) {
        // Update header user info
        const fullName = (user.first_name || '') + ' ' + (user.last_name || '');
        $('#user-display-name').text(fullName || 'Admin');
        if (user.image_path) {
            $('#user-avatar').attr('src', user.image_path);
        }
    }

    if (!token || user.role !== 'admin') {
        $('#access-denied').show();
        $('#admin-content').hide();
        $('#user-info').hide();
        return;
    }

    const API = 'http://localhost:3000';

    PrettyPettyUI.initButtons('button, input[type="submit"], #cancel-edit-btn');
    PrettyPettyUI.initSelectmenu('#edit-role, #edit-status');

    // Logout handler
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    let usersTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function loadUsers() {
        $.ajax({
            url: API + '/api/users',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                // API returns a plain array directly
                const users = (Array.isArray(res) ? res : []).map(function(u) {
                    return {
                        DT_RowId: 'row_' + u.id,
                        id: u.id,
                        name: (u.first_name || '') + ' ' + (u.last_name || ''),
                        email: u.email,
                        role: u.role,
                        status: u.status,
                        address: u.delivery_address || '-',
                        registered: formatDate(u.created_at),
                        actions: '<button class="edit-btn" data-id="' + u.id + '" data-first-name="' + (u.first_name || '') + '" data-last-name="' + (u.last_name || '') + '" data-email="' + u.email + '" data-role="' + u.role + '" data-status="' + u.status + '">Edit</button>'
                    };
                });
                if (usersTable) { usersTable.destroy(); }
                usersTable = $('#users-table').DataTable({
                    data: users,
                    destroy: true,
                    columns: [
                        { data: 'id' },
                        { data: 'name' },
                        { data: 'email' },
                        { data: 'role' },
                        { data: 'status' },
                        { data: 'address' },
                        { data: 'registered' },
                        { data: 'actions', orderable: false }
                    ]
                });
            },
            error: function() { $('#action-error').text('Failed to load users.'); }
        });
    }

    // Edit user
    $(document).on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        const firstName = $(this).data('first-name');
        const lastName = $(this).data('last-name');
        const email = $(this).data('email');
        const role = $(this).data('role');
        const status = $(this).data('status');

        $('#edit-user-id').val(id);
        $('#edit-user-name-display').text(firstName + ' ' + lastName);
        $('#edit-user-email-display').text(email);
        $('#edit-role').val(role);
        $('#edit-status').val(status);
        PrettyPettyUI.refreshSelectmenu('#edit-role');
        PrettyPettyUI.refreshSelectmenu('#edit-status');
        $('#edit-user-section').show('blind', 300);
        $('#action-success').text('');
        $('#action-error').text('');
        $('html, body').animate({ scrollTop: 0 }, 300);
    });

    // Save changes
    $('#edit-user-form').on('submit', function(e) {
        e.preventDefault();
        const id = $('#edit-user-id').val();
        const role = $('#edit-role').val();
        const status = $('#edit-status').val();

        $.ajax({
            url: API + '/api/users/' + id,
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify({ role: role, status: status }),
            success: function() {
                $('#action-success').text('User updated successfully!');
                $('#edit-user-section').hide();
                loadUsers();
            },
            error: function(xhr) {
                $('#action-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Failed to update user.');
            }
        });
    });

    // Cancel edit
    $('#cancel-edit-btn').on('click', function() {
        $('#edit-user-section').hide('blind', 300);
        $('#action-success').text('');
        $('#action-error').text('');
    });

    loadUsers();
});
