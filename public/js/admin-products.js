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
    PrettyPettyUI.initButtons('button, input[type="submit"], #cancel-edit-btn');
    PrettyPettyUI.initSelectmenu('#prod-category, #prod-status');
    PrettyPettyUI.initButtons('#submit-btn', '#cancel-edit-btn');

    let productsTable;

    function getFilterParams() {
        const params = [];
        const status = $('#filter-status').val();
        const trashed = $('#filter-trashed').val();
        if (status) params.push('status=' + encodeURIComponent(status));
        if (trashed === 'true') params.push('includeDeleted=true');
        return params.length ? '?' + params.join('&') : '';
    }

    $('#filter-status, #filter-trashed').on('change', function() {
        loadProducts();
    });

    function renderProductActions(p) {
        const id = p.id;
        if (p.deleted_at) {
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
                url: API + '/api/products/bulk',
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
                data: JSON.stringify({ ids: ids }),
                success: function(res) {
                    $('#form-success').text(res.message);
                    $('#select-all-checkbox').prop('checked', false);
                    loadProducts();
                },
                error: function(xhr) {
                    $('#form-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Bulk delete failed.');
                }
            });
        });
    });

    $(document).on('click', '.restore-btn', function() {
        const id = $(this).data('id');
        PrettyPettyUI.confirm('Restore this product?', function() {
            $.ajax({
                url: API + '/api/products/' + id + '/restore',
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token },
                success: function() { loadProducts(); },
                error: function(xhr) {
                    $('#form-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Restore failed.');
                }
            });
        });
    });

    function loadProducts() {
        $.ajax({
            url: API + '/api/products' + getFilterParams(),
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                const products = (Array.isArray(res) ? res : []).map(function(p) {
                    const img = (p.Product_Images && p.Product_Images.length > 0) ? p.Product_Images[0].image_path || p.Product_Images[0] : '/uploads/no-image.jpg';
                    return {
                        DT_RowId: 'row_' + p.id,
                        id: p.id,
                        image: img,
                        name: p.name,
                        category: p.Category ? (p.Category.deleted_at ? p.Category.name + ' (soft-deleted)' : p.Category.name) : (p.category_id || '-'),
                        price: parseFloat(p.price).toFixed(2),
                        stock: p.stock,
                        status: p.status,
                        deletedAt: p.deleted_at || null,
                        actions: renderProductActions(p)
                    };
                });
                if (productsTable) { productsTable.destroy(); }
                productsTable = $('#products-table').DataTable({
                    data: products,
                    destroy: true,
                    columns: [
                        { data: null, orderable: false, searchable: false, render: function(d, type, row) {
                            const isDeleted = row.deletedAt ? true : false;
                            return '<input type="checkbox" class="row-checkbox" data-id="' + row.id + '" data-deleted="' + isDeleted + '">';
                        }},
                        { data: 'id' },
                        { data: 'image', orderable: false, render: function(d) { return '<img src="' + d + '" width="40">'; } },
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
                const cats = Array.isArray(res) ? res : [];
                let html = '<option value="">-- Select Category --</option>';
                cats.forEach(function(c) {
                    html += '<option value="' + c.id + '">' + c.name + '</option>';
                });
                $('#prod-category').html(html);
                PrettyPettyUI.refreshSelectmenu('#prod-category');
            }
        });
    }

    $.validator.addMethod('requireImagesOnCreate', function(value, element) {
        if ($('#prod-id').val()) {
            return true;
        }
        return element.files && element.files.length > 0;
    }, 'Please select at least one product image.');

    $.validator.addMethod('imageFile', function(value, element) {
        if (!element.files || !element.files.length) {
            return true;
        }
        return Array.from(element.files).every(function(file) {
            return /\.(jpe?g|png|gif|webp)$/i.test(file.name);
        });
    }, 'Please upload valid image files (jpg, jpeg, png, gif, webp).');

    function submitProductForm(form) {
        $('#form-error').text('');
        $('#form-success').text('');

        const categoryId = $('#prod-category').val();
        if (!categoryId) {
            $('#prod-category-error').text('Please select a category.');
            return;
        }

        const prodId = $('#prod-id').val();
        const formData = new FormData(form);

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
    }

    $('#product-form').validate({
        rules: {
            name: {
                required: true,
                minlength: 2,
                maxlength: 100
            },
            category_id: {
                required: true
            },
            description: {
                maxlength: 500
            },
            price: {
                required: true,
                number: true,
                min: 0.01
            },
            stock: {
                required: true,
                digits: true,
                min: 0
            },
            status: {
                required: true
            },
            images: {
                requireImagesOnCreate: true,
                imageFile: true
            }
        },
        messages: {
            name: {
                required: 'Product name is required.',
                minlength: 'Product name must be at least 2 characters.',
                maxlength: 'Product name cannot exceed 100 characters.'
            },
            category_id: {
                required: 'Please select a category.'
            },
            description: {
                maxlength: 'Description cannot exceed 500 characters.'
            },
            price: {
                required: 'Price is required.',
                number: 'Price must be a valid number.',
                min: 'Price must be greater than 0.'
            },
            stock: {
                required: 'Stock quantity is required.',
                digits: 'Stock must be a whole number.',
                min: 'Stock cannot be negative.'
            },
            status: {
                required: 'Please select a status.'
            }
        },
        errorPlacement: function(error, element) {
            error.appendTo('#' + element.attr('id') + '-error');
        },
        submitHandler: function(form) {
            submitProductForm(form);
        }
    });

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
                PrettyPettyUI.refreshSelectmenu('#prod-category');
                PrettyPettyUI.refreshSelectmenu('#prod-status');
                $('#submit-btn').text('Update Product');
                $('#cancel-edit-btn').show();

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

    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        PrettyPettyUI.confirm('Are you sure you want to delete this product?', function() {
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
    });

    $(document).on('click', '.delete-img-btn', function() {
        const imageId = $(this).data('image-id');
        const $btn = $(this);
        PrettyPettyUI.confirm('Delete this image?', function() {
            $.ajax({
                url: API + '/api/products/images/' + imageId,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    $btn.closest('div').remove();
                    loadProducts();
                },
                error: function() { $('#form-error').text('Failed to delete image.'); }
            });
        });
    });

    $('#cancel-edit-btn').on('click', function() {
        resetProductForm();
    });

    function resetProductForm() {
        const validator = $('#product-form').validate();
        validator.resetForm();
        $('#product-form')[0].reset();
        $('#prod-id').val('');
        $('#submit-btn').text('Add Product');
        $('#cancel-edit-btn').hide();
        $('#existing-images-container').empty();
        $('#form-success').text('');
        $('#form-error').text('');
        $('.error-text').empty();
    }

    loadProducts();
    loadCategories();
});
