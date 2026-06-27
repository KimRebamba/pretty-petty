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

    PrettyPettyUI.initButtons('#logout-btn');

    // Logout handler
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    let reviewsTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function renderStars(rating) {
        const r = parseInt(rating) || 0;
        return '★'.repeat(r) + '☆'.repeat(5 - r) + ' (' + r + '/5)';
    }

    function loadReviews() {
        $.ajax({
            url: API + '/api/reviews',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                // API returns a plain array directly
                const reviews = (Array.isArray(res) ? res : []).map(function(r) {
                    const customer = r.User ? r.User.first_name + ' ' + r.User.last_name : 'User #' + (r.user_id || '-');
                    const product = r.Product ? r.Product.name : 'Product #' + (r.product_id || '-');
                    const status = r.verified_at ? 'Verified' : 'Pending';
                    return {
                        DT_RowId: 'row_' + r.id,
                        id: r.id,
                        customer: customer,
                        product: product,
                        rating: renderStars(r.rating),
                        comment: r.comment || '-',
                        status: status,
                        date: formatDate(r.created_at),
                        actions: '<button class="verify-btn" data-id="' + r.id + '">Verify</button> <button class="delete-btn" data-id="' + r.id + '">Delete</button>'
                    };
                });
                if (reviewsTable) { reviewsTable.destroy(); }
                reviewsTable = $('#reviews-table').DataTable({
                    data: reviews,
                    destroy: true,
                    columns: [
                        { data: 'id' },
                        { data: 'customer' },
                        { data: 'product' },
                        { data: 'rating', orderable: false },
                        { data: 'comment' },
                        { data: 'status' },
                        { data: 'date' },
                        { data: 'actions', orderable: false }
                    ]
                });
            },
            error: function() { $('#action-error').text('Failed to load reviews.'); }
        });
    }

    // Verify review
    $(document).on('click', '.verify-btn', function() {
        const id = $(this).data('id');
        $.ajax({
            url: API + '/api/reviews/' + id + '/verify',
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token },
            success: function() {
                $('#action-success').text('Review verified successfully!');
                loadReviews();
            },
            error: function() { $('#action-error').text('Failed to verify review.'); }
        });
    });

    // Delete review
    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        PrettyPettyUI.confirm('Are you sure you want to delete this review?', function() {
            $.ajax({
                url: API + '/api/reviews/' + id,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    loadReviews();
                },
                error: function() { $('#action-error').text('Failed to delete review.'); }
            });
        });
    });

    loadReviews();
});
