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

    // Logout handler
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    let categoriesTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function loadCategories() {
        $.ajax({
            url: API + '/api/categories',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                // API returns a plain array directly
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
                        actions: '<button class="edit-btn" data-id="' + c.id + '">Edit</button> <button class="delete-btn" data-id="' + c.id + '">Delete</button>'
                    };
                });
                if (categoriesTable) { categoriesTable.destroy(); }
                categoriesTable = $('#categories-table').DataTable({
                    data: cats,
                    destroy: true,
                    columns: [
                        { data: 'id' },
                        { data: 'image', orderable: false, render: function(d) { return '<img src="' + d + '" width="50">'; } },
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

    // Create / Update category
    $('#category-form').on('submit', function(e) {
        e.preventDefault();
        $('#form-error').text('');
        $('#form-success').text('');

        const catId = $('#cat-id').val();
        const formData = new FormData(this);
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
    });

    // Edit category
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
                $('#submit-btn').text('Update Category');
                $('#cancel-edit-btn').show();

                // Show current image preview — image_path is a direct field on the model
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

    // Delete category
    $(document).on('click', '.delete-btn', function() {
        if (!confirm('Are you sure you want to delete this category?')) return;
        const id = $(this).data('id');
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

    // Cancel edit
    $('#cancel-edit-btn').on('click', function() {
        resetCategoryForm();
    });

    function resetCategoryForm() {
        $('#category-form')[0].reset();
        $('#cat-id').val('');
        $('#submit-btn').text('Add Category');
        $('#cancel-edit-btn').hide();
        $('#current-image-container').hide();
        $('#form-success').text('');
        $('#form-error').text('');
    }

    loadCategories();
});
