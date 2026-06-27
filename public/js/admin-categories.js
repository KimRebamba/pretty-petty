$(document).ready(function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
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
        const token = localStorage.getItem('token');
        if (token && user && user.id) {
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
    PrettyPettyUI.initButtons('#submit-btn', '#cancel-edit-btn');
    PrettyPettyUI.initButtons('button, input[type="submit"], #cancel-edit-btn');
    PrettyPettyUI.initSelectmenu('#cat-status');

    let categoriesTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function getFilterParams() {
        const params = [];
        const status = $('#filter-status').val();
        const trashed = $('#filter-trashed').val();
        if (status) params.push('status=' + encodeURIComponent(status));
        if (trashed === 'true') params.push('includeDeleted=true');
        return params.length ? '?' + params.join('&') : '';
    }

    $('#filter-status, #filter-trashed').on('change', function() {
        loadCategories();
    });

    function renderCategoryActions(c) {
        const id = c.id;
        if (c.deleted_at) {
            return '<button class="restore-btn" data-id="' + id + '">Restore</button>';
        }
        return '<button class="edit-btn" data-id="' + id + '">Edit</button> <button class="delete-btn" data-id="' + id + '">Delete</button>';
    }

    $(document).on('change', '#select-all-checkbox', function() {
        $('.row-checkbox').prop('checked', this.checked);
        updateBulkBar();
    });

    $(document).on('change', '.row-checkbox', function() {
        updateBulkBar();
        const total = $('.row-checkbox').length;
        const checked = $('.row-checkbox:checked').length;
        $('#select-all-checkbox').prop('checked', total > 0 && total === checked);
    });

    function updateBulkBar() {
        const count = $('.row-checkbox:checked').length;
        if (count > 0) {
            $('#selected-count').text(count);
            $('#bulk-bar').show();
        } else {
            $('#bulk-bar').hide();
        }
    }

    $('#bulk-delete-btn').on('click', function() {
        const ids = [];
        $('.row-checkbox:checked').each(function() {
            ids.push(parseInt($(this).data('id')));
        });
        if (ids.length === 0) return;
        PrettyPettyUI.confirm('Delete ' + ids.length + ' selected item(s)?', function() {
            $.ajax({
                url: API + '/api/categories/bulk',
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
                data: JSON.stringify({ ids: ids }),
                success: function(res) {
                    $('#form-success').text(res.message);
                    $('#select-all-checkbox').prop('checked', false);
                    loadCategories();
                },
                error: function(xhr) {
                    $('#form-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Bulk delete failed.');
                }
            });
        });
    });

    $(document).on('click', '.restore-btn', function() {
        const id = $(this).data('id');
        PrettyPettyUI.confirm('Restore this category?', function() {
            $.ajax({
                url: API + '/api/categories/' + id + '/restore',
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token },
                success: function() { loadCategories(); },
                error: function(xhr) {
                    $('#form-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Restore failed.');
                }
            });
        });
    });

    function loadCategories() {
        $.ajax({
            url: API + '/api/categories' + getFilterParams(),
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                const cats = (Array.isArray(res) ? res : []).map(function(c) {
                    const img = c.image_path || '/uploads/no-image.jpg';
                    return {
                        DT_RowId: 'row_' + c.id,
                        id: c.id,
                        image: img,
                        name: c.name,
                        description: c.description || '-',
                        status: c.status,
                        createdAt: formatDate(c.created_at),
                        deletedAt: c.deleted_at || null,
                        actions: renderCategoryActions(c)
                    };
                });
                if (categoriesTable) { categoriesTable.destroy(); }
                categoriesTable = $('#categories-table').DataTable({
                    data: cats,
                    destroy: true,
                    columns: [
                        { data: null, orderable: false, searchable: false, render: function(d, type, row) {
                            const isDeleted = row.deletedAt ? true : false;
                            return '<input type="checkbox" class="row-checkbox" data-id="' + row.id + '" data-deleted="' + isDeleted + '">';
                        }},
                        { data: 'id' },
                        { data: 'image', orderable: false, render: function(d) { return '<img src="' + d + '" width="40">'; } },
                        { data: 'name' },
                        { data: 'description' },
                        { data: 'status' },
                        { data: 'createdAt' },
                        { data: 'actions', orderable: false }
                    ]
                });
            },
            error: function() { $('#form-error').text('Failed to load categories.'); }
        });
    }

    $.validator.addMethod('requireImageOnCreate', function(value, element) {
        if ($('#cat-id').val()) {
            return true;
        }
        return element.files && element.files.length > 0;
    }, 'Please select a category image.');

    $.validator.addMethod('imageFile', function(value, element) {
        if (!element.files || !element.files.length) {
            return true;
        }
        return /\.(jpe?g|png|gif|webp)$/i.test(element.files[0].name);
    }, 'Please upload a valid image file (jpg, jpeg, png, gif, webp).');

    function submitCategoryForm(form) {
        $('#form-error').text('');
        $('#form-success').text('');

        const catId = $('#cat-id').val();
        const formData = new FormData(form);
        if (!catId) { formData.delete('id'); }

        const isEdit = !!catId;
        const url = isEdit ? API + '/api/categories/' + catId : API + '/api/categories';
        const method = isEdit ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            method: method,
            headers: { Authorization: 'Bearer ' + token },
            data: formData,
            processData: false,
            contentType: false,
            success: function() {
                $('#form-success').text(isEdit ? 'Category updated!' : 'Category created!');
                resetCategoryForm();
                loadCategories();
            },
            error: function(xhr) {
                $('#form-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Operation failed.');
            }
        });
    }

    $('#category-form').validate({
        rules: {
            name: {
                required: true,
                minlength: 2,
                maxlength: 100
            },
            description: {
                maxlength: 500
            },
            status: {
                required: true
            },
            image: {
                requireImageOnCreate: true,
                imageFile: true
            }
        },
        messages: {
            name: {
                required: 'Category name is required.',
                minlength: 'Category name must be at least 2 characters.',
                maxlength: 'Category name cannot exceed 100 characters.'
            },
            description: {
                maxlength: 'Description cannot exceed 500 characters.'
            },
            status: {
                required: 'Please select a status.'
            }
        },
        errorPlacement: function(error, element) {
            error.appendTo('#' + element.attr('id') + '-error');
        },
        submitHandler: function(form) {
            submitCategoryForm(form);
        }
    });

    $(document).on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        $.ajax({
            url: API + '/api/categories/' + id,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(c) {
                $('#cat-id').val(c.id);
                $('#cat-name').val(c.name);
                $('#cat-description').val(c.description);
                $('#cat-status').val(c.status);
                PrettyPettyUI.refreshSelectmenu('#cat-status');
                $('#submit-btn').text('Update Category');
                $('#cancel-edit-btn').show();

                const imgSrc = c.image_path || '';
                if (imgSrc) {
                    $('#current-image-preview').attr('src', imgSrc);
                    $('#current-image-container').show();
                } else {
                    $('#current-image-container').hide();
                }
                $('html, body').animate({ scrollTop: 0 }, 300);
            },
            error: function() { $('#form-error').text('Failed to load category.'); }
        });
    });

    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        PrettyPettyUI.confirm('Are you sure you want to delete this category?', function() {
            $.ajax({
                url: API + '/api/categories/' + id,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    loadCategories();
                },
                error: function() { $('#form-error').text('Failed to delete category.'); }
            });
        });
    });

    $('#cancel-edit-btn').on('click', function() {
        resetCategoryForm();
    });

    function resetCategoryForm() {
        const validator = $('#category-form').validate();
        validator.resetForm();
        $('#category-form')[0].reset();
        $('#cat-id').val('');
        $('#submit-btn').text('Add Category');
        $('#cancel-edit-btn').hide();
        $('#current-image-container').hide();
        $('#form-success').text('');
        $('#form-error').text('');
        $('.error-text').empty();
    }

    loadCategories();
});
