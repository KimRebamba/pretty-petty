$(document).ready(function() {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || currentUser.role !== 'admin') {
        window.location.href = '/index.html?msg=admin_required';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) {
        const $banner = $('#alert-banner');
        let text = msg.replace(/_/g, ' ');
        $banner.text(text).show();
        setTimeout(function () { $banner.slideUp(); }, 5000);
        if (window.history.replaceState) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }

    function initUserState() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tk = localStorage.getItem('token');
        if (tk && user && user.id) {
            $('#nav-user').css('display', 'flex');
            const fullName = (user.first_name || '') + ' ' + (user.last_name || '');
            $('#user-display-name').text(fullName || 'Admin');
            if (user.image_path) $('#user-avatar').attr('src', user.image_path);
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

    PrettyPettyUI.initButtons('#logout-link');
    PrettyPettyUI.initButtons('button, input[type="submit"], #cancel-edit-btn, #bulk-delete-btn');
    PrettyPettyUI.initSelectmenu('#edit-role, #edit-status');

    let usersTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function statusBadge(status, isDeleted) {
        if (isDeleted) {
            return '<span class="admin-badge" style="background:#fce4ec;color:#c62828;">[DELETED]</span>';
        }
        if (status === 'active') {
            return '<span class="admin-badge" style="background:#e8f5e9;color:#2e7d32;">Active</span>';
        }
        return '<span class="admin-badge" style="background:#fce4ec;color:#c62828;">Inactive</span>';
    }

    function roleBadge(role) {
        if (role === 'admin') {
            return '<span class="admin-badge" style="background:#fff3e0;color:#e65100;">Admin</span>';
        }
        return 'Customer';
    }

    function loadUsers() {
        let url = API + '/api/users';
        const includeDeleted = $('#include-deleted').is(':checked');
        if (includeDeleted) {
            url += '?includeDeleted=true';
        }

        $.ajax({
            url: url,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                const users = Array.isArray(res) ? res : [];
                const rows = users.map(function(u) {
                    const name = (u.first_name || '') + ' ' + (u.last_name || '');
                    const isDeleted = !!u.deleted_at;
                    const address = u.delivery_address || '-';
                    const actions = [];
                    if (!isDeleted) {
                        actions.push('<button class="edit-btn" data-id="' + u.id + '">Edit</button>');
                    }
                    if (isDeleted) {
                        actions.push('<button class="restore-btn" data-id="' + u.id + '">Restore</button>');
                    }

                    return {
                        DT_RowId: 'row_' + u.id,
                        checkbox: '<input type="checkbox" class="row-checkbox" data-id="' + u.id + '">',
                        id: u.id,
                        name: name,
                        email: u.email,
                        role: roleBadge(u.role),
                        status: statusBadge(u.status, isDeleted),
                        address: address,
                        registered: formatDate(u.created_at),
                        actions: actions.join(' ')
                    };
                });

                if (usersTable) { usersTable.destroy(); }
                usersTable = $('#users-table').DataTable({
                    data: rows,
                    destroy: true,
                    columnDefs: [
                        { targets: 0, orderable: false, searchable: false },
                        { targets: 8, orderable: false, searchable: false },
                        {
                            targets: '_all',
                            createdCell: function(td, cellData, rowData) {
                                if (rowData.DT_RowId && rowData.status && rowData.status.indexOf('[DELETED]') !== -1) {
                                    $(td).closest('tr').addClass('deleted-row');
                                }
                            }
                        }
                    ],
                    columns: [
                        { data: 'checkbox' },
                        { data: 'id' },
                        { data: 'name' },
                        { data: 'email' },
                        { data: 'role' },
                        { data: 'status' },
                        { data: 'address' },
                        { data: 'registered' },
                        { data: 'actions' }
                    ],
                    drawCallback: function() {
                        updateBulkDeleteBtn();
                        $('#select-all').prop('checked', false);
                    }
                });
            },
            error: function(xhr) {
                const msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Failed to load users.';
                $('#action-error').text(msg);
            }
        });
    }

    $(document).on('change', '#select-all', function() {
        const checked = $(this).prop('checked');
        $('.row-checkbox').prop('checked', checked);
        updateBulkDeleteBtn();
    });

    $(document).on('change', '.row-checkbox', function() {
        const total = $('.row-checkbox').length;
        const checked = $('.row-checkbox:checked').length;
        if (total > 0 && checked === total) {
            $('#select-all').prop('checked', true);
        } else {
            $('#select-all').prop('checked', false);
        }
        updateBulkDeleteBtn();
    });

    function updateBulkDeleteBtn() {
        const count = $('.row-checkbox:checked').length;
        if (count > 0) {
            $('#selected-count').text(count);
            $('#bulk-delete-btn').show();
        } else {
            $('#bulk-delete-btn').hide();
        }
    }

    $('#bulk-delete-btn').on('click', function() {
        const ids = [];
        $('.row-checkbox:checked').each(function() {
            ids.push($(this).data('id'));
        });
        if (ids.length === 0) return;

        PrettyPettyUI.confirm('Are you sure you want to delete ' + ids.length + ' user(s)?', function() {
            $.ajax({
                url: API + '/api/users/bulk',
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
                data: JSON.stringify({ ids: ids }),
                success: function() {
                    PrettyPettyUI.flashMessage('#action-success', ids.length + ' user(s) deleted.', 'success');
                    $('#action-error').text('');
                    loadUsers();
                },
                error: function(xhr) {
                    const msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Failed to delete users.';
                    PrettyPettyUI.flashMessage('#action-error', msg, 'error');
                    $('#action-success').text('');
                }
            });
        });
    });

    $(document).on('click', '.restore-btn', function() {
        const id = $(this).data('id');
        PrettyPettyUI.confirm('Restore this user?', function() {
            $.ajax({
                url: API + '/api/users/' + id + '/restore',
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    PrettyPettyUI.flashMessage('#action-success', 'User restored.', 'success');
                    $('#action-error').text('');
                    loadUsers();
                },
                error: function(xhr) {
                    const msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Failed to restore user.';
                    PrettyPettyUI.flashMessage('#action-error', msg, 'error');
                    $('#action-success').text('');
                }
            });
        });
    });

    $(document).on('click', '.edit-btn', function() {
        const id = $(this).data('id');

        $.ajax({
            url: API + '/api/users/' + id,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(u) {
                $('#edit-user-id').val(u.id);
                $('#edit-first-name').val(u.first_name || '');
                $('#edit-last-name').val(u.last_name || '');
                $('#edit-email').val(u.email || '');
                $('#edit-password').val('');
                $('#edit-role').val(u.role || 'customer');
                $('#edit-status').val(u.status || 'active');
                PrettyPettyUI.refreshSelectmenu('#edit-role');
                PrettyPettyUI.refreshSelectmenu('#edit-status');

                if (u.id === currentUser.id) {
                    $('#edit-role').prop('disabled', true);
                    $('#edit-status').prop('disabled', true);
                    $('#self-edit-warning').show();
                    try { $('#edit-role').selectmenu('disable'); } catch(e) {}
                    try { $('#edit-status').selectmenu('disable'); } catch(e) {}
                } else {
                    $('#edit-role').prop('disabled', false);
                    $('#edit-status').prop('disabled', false);
                    $('#self-edit-warning').hide();
                    try { $('#edit-role').selectmenu('enable'); } catch(e) {}
                    try { $('#edit-status').selectmenu('enable'); } catch(e) {}
                }

                $('#submit-btn').text('Update User');
                $('#cancel-edit-btn').show();

                const validator = $('#user-form').validate();
                validator.resetForm();
                $('.error-text').empty();

                $('#action-success').text('');
                $('#action-error').text('');

                $('html, body').animate({ scrollTop: 0 }, 300);
            },
            error: function() {
                $('#action-error').text('Failed to load user data.');
            }
        });
    });

    $('#user-form').validate({
        rules: {
            first_name: {
                required: true,
                minlength: 2,
                maxlength: 100
            },
            last_name: {
                required: true,
                minlength: 2,
                maxlength: 100
            },
            email: {
                required: true,
                email: true,
                maxlength: 255
            },
            password: {
                required: function() { return !$('#edit-user-id').val(); },
                minlength: 6
            },
            role: { required: true },
            status: { required: true }
        },
        messages: {
            first_name: {
                required: 'First name is required.',
                minlength: 'Min 2 characters.',
                maxlength: 'Max 100 characters.'
            },
            last_name: {
                required: 'Last name is required.',
                minlength: 'Min 2 characters.',
                maxlength: 'Max 100 characters.'
            },
            email: {
                required: 'Email is required.',
                email: 'Enter a valid email address.',
                maxlength: 'Max 255 characters.'
            },
            password: {
                required: 'Password is required for new users.',
                minlength: 'Min 6 characters.'
            },
            role: { required: 'Select a role.' },
            status: { required: 'Select a status.' }
        },
        errorPlacement: function(error, element) {
            error.appendTo('#' + element.attr('id') + '-error');
        },
        submitHandler: function(form) {
            submitUserForm(form);
        }
    });

    function submitUserForm(form) {
        $('#action-success').text('');
        $('#action-error').text('');

        const userId = $('#edit-user-id').val();
        const isEdit = !!userId;

        const firstName = $('#edit-first-name').val().trim();
        const lastName = $('#edit-last-name').val().trim();
        const email = $('#edit-email').val().trim();
        const password = $('#edit-password').val();
        const role = $('#edit-role').val();
        const status = $('#edit-status').val();

        const body = {
            first_name: firstName,
            last_name: lastName,
            email: email
        };

        if (userId != currentUser.id) {
            body.role = role;
            body.status = status;
        }

        if (password && password.trim().length > 0) {
            body.password = password;
        }

        const url = isEdit ? API + '/api/users/' + userId : API + '/api/users';
        const method = isEdit ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            method: method,
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify(body),
            success: function() {
                if (isEdit && userId == currentUser.id) {
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    storedUser.first_name = firstName;
                    storedUser.last_name = lastName;
                    storedUser.email = email;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                    initUserState();
                }

                PrettyPettyUI.flashMessage('#action-success', isEdit ? 'User updated!' : 'User created!', 'success');
                $('#action-error').text('');
                resetUserForm();
                loadUsers();
            },
            error: function(xhr) {
                let msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Operation failed.';
                if (xhr.status === 403) {
                    msg = msg || 'You cannot modify your own account in this way.';
                }
                PrettyPettyUI.flashMessage('#action-error', msg, 'error');
                $('#action-success').text('');
            }
        });
    }

    $('#cancel-edit-btn').on('click', function() {
        resetUserForm();
    });

    function resetUserForm() {
        const validator = $('#user-form').validate();
        validator.resetForm();
        $('#user-form')[0].reset();
        $('#edit-user-id').val('');
        $('#submit-btn').text('Add User');
        $('#cancel-edit-btn').hide();
        $('#action-success').text('');
        $('#action-error').text('');
        $('.error-text').empty();

        $('#edit-role').prop('disabled', false);
        $('#edit-status').prop('disabled', false);
        $('#self-edit-warning').hide();
        try { $('#edit-role').selectmenu('enable'); } catch(e) {}
        try { $('#edit-status').selectmenu('enable'); } catch(e) {}
        PrettyPettyUI.refreshSelectmenu('#edit-role');
        PrettyPettyUI.refreshSelectmenu('#edit-status');
    }

    $('#include-deleted').on('change', function() {
        loadUsers();
    });

    loadUsers();
});
