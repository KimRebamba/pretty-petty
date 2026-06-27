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
        // Don't redirect — show the message instead
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

    let productsTable;

    function loadProducts() {
        $.ajax({
            url: API + '/api/products',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                // API returns a plain array directly
                const products = (Array.isArray(res) ? res : []).map(function(p) {
                    const img = (p.Product_Images && p.Product_Images.length > 0) ? p.Product_Images[0].image_path || p.Product_Images[0] : '/uploads/no-image.jpg';
                    return {
                        DT_RowId: 'row_' + p.id,
                        id: p.id,
                        image: img,
                        name: p.name,
                        category: p.Category ? p.Category.name : (p.category_id || '-'),
                        price: parseFloat(p.price).toFixed(2),
                        stock: p.stock,
                        status: p.status,
                        actions: '<button class="edit-btn" data-id="' + p.id + '">Edit</button> <button class="delete-btn" data-id="' + p.id + '">Delete</button>'
                    };
                });
                if (productsTable) { productsTable.destroy(); }
                productsTable = $('#products-table').DataTable({
                    data: products,
                    destroy: true,
                    columns: [
                        { data: 'id' },
                        { data: 'image', orderable: false, render: function(d) { return '<img src="' + d + '" width="50">'; } },
                        { data: 'name' },
                        { data: 'category' },
                        { data: 'price' },
                        { data: 'stock' },
                        { data: 'status' },
                        { data: 'actions', orderable: false }
                    ]
                });
            },
            error: function() { $('#form-error').text('Failed to load products.'); }
        });
    }

    function loadCategories() {
        $.ajax({
            url: API + '/api/categories',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                // API returns a plain array directly
                const cats = Array.isArray(res) ? res : [];
                let html = '<option value="">-- Select Category --</option>';
                cats.forEach(function(c) {
                    html += '<option value="' + c.id + '">' + c.name + '</option>';
                });
                $('#prod-category').html(html);
            }
        });
    }

    // Create / Update product
    $('#product-form').on('submit', function(e) {
        e.preventDefault();
        $('#form-error').text('');
        $('#form-success').text('');

        const prodId = $('#prod-id').val();
        const formData = new FormData(this);

        // Remove empty prod-id so it doesn't create a field named "id" on create
        if (!prodId) { formData.delete('id'); }

        const isEdit = !!prodId;
        const url = isEdit ? API + '/api/products/' + prodId : API + '/api/products';
        const method = isEdit ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            method: method,
            headers: { Authorization: 'Bearer ' + token },
            data: formData,
            processData: false,
            contentType: false,
            success: function() {
                $('#form-success').text(isEdit ? 'Product updated!' : 'Product created!');
                resetProductForm();
                loadProducts();
            },
            error: function(xhr) {
                $('#form-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Operation failed.');
            }
        });
    });

    // Edit product
    $(document).on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        $.ajax({
            url: API + '/api/products/' + id,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(p) {
                $('#prod-id').val(p.id);
                $('#prod-name').val(p.name);
                $('#prod-category').val(p.category_id);
                $('#prod-description').val(p.description);
                $('#prod-price').val(p.price);
                $('#prod-stock').val(p.stock);
                $('#prod-status').val(p.status);
                $('#submit-btn').text('Update Product');
                $('#cancel-edit-btn').show();

                // Show existing images — Sequelize returns Product_Images
                const container = $('#existing-images-container').empty();
                if (p.Product_Images && p.Product_Images.length) {
                    p.Product_Images.forEach(function(img) {
                        const imgId = img.id;
                        const imgSrc = img.image_path || img;
                        container.append(
                            '<div style="display:inline-block;position:relative;margin:5px;">' +
                            '<img src="' + imgSrc + '" width="50">' +
                            '<button type="button" class="delete-img-btn" data-image-id="' + imgId + '" style="position:absolute;top:-5px;right:-5px;background:red;color:white;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:10px;line-height:1;">X</button>' +
                            '</div>'
                        );
                    });
                }
                $('html, body').animate({ scrollTop: 0 }, 300);
            },
            error: function() { $('#form-error').text('Failed to load product.'); }
        });
    });

    // Delete product
    $(document).on('click', '.delete-btn', function() {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const id = $(this).data('id');
        $.ajax({
            url: API + '/api/products/' + id,
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token },
            success: function() {
                loadProducts();
            },
            error: function() { $('#form-error').text('Failed to delete product.'); }
        });
    });

    // Delete image
    $(document).on('click', '.delete-img-btn', function() {
        const imageId = $(this).data('image-id');
        $.ajax({
            url: API + '/api/products/images/' + imageId,
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token },
            success: function() {
                $(this).closest('div').remove();
                loadProducts();
            }.bind(this),
            error: function() { $('#form-error').text('Failed to delete image.'); }
        });
    });

    // Cancel edit
    $('#cancel-edit-btn').on('click', function() {
        resetProductForm();
    });

    function resetProductForm() {
        $('#product-form')[0].reset();
        $('#prod-id').val('');
        $('#submit-btn').text('Add Product');
        $('#cancel-edit-btn').hide();
        $('#existing-images-container').empty();
        $('#form-success').text('');
        $('#form-error').text('');
    }

    loadProducts();
    loadCategories();
});
