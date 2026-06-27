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

    let ordersTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function loadOrders() {
        $.ajax({
            url: API + '/api/orders',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                // API returns a plain array directly
                const orders = (Array.isArray(res) ? res : []).map(function(o) {
                    const customer = o.User ? o.User.first_name + ' ' + o.User.last_name : 'User #' + (o.user_id || '-');
                    return {
                        DT_RowId: 'row_' + o.id,
                        id: o.id,
                        customer: customer,
                        status: o.status,
                        date: formatDate(o.created_at),
                        actions: '<button class="view-order-btn" data-order-id="' + o.id + '">View</button>'
                    };
                });
                if (ordersTable) { ordersTable.destroy(); }
                ordersTable = $('#orders-table').DataTable({
                    data: orders,
                    destroy: true,
                    columns: [
                        { data: 'id' },
                        { data: 'customer' },
                        { data: 'status' },
                        { data: 'date' },
                        { data: 'actions', orderable: false }
                    ]
                });
            },
            error: function() { $('#list-error').text('Failed to load orders.'); }
        });
    }

    // View order details
    $(document).on('click', '.view-order-btn', function() {
        const orderId = $(this).data('order-id');
        $.ajax({
            url: API + '/api/orders/' + orderId,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(order) {
                $('#detail-order-id').text(order.id);
                $('#detail-user-id').text(order.User ? (order.User.first_name + ' ' + order.User.last_name) : 'User #' + order.user_id);
                $('#detail-date').text(formatDate(order.created_at));
                $('#update-order-id').val(order.id);
                $('#update-status').val(order.status);

                // Populate items — Sequelize returns Order_Items
                const items = order.Order_Items || [];
                let grandTotal = 0;
                const tbody = $('#order-items-tbody').empty();
                items.forEach(function(item) {
                    const unitPrice = parseFloat(item.unit_price || 0);
                    const qty = parseInt(item.quantity || 0);
                    const lineTotal = parseFloat(item.price || (unitPrice * qty));
                    grandTotal += lineTotal;
                    const prodName = item.Product ? item.Product.name : (item.product_name || 'Product #' + (item.product_id || '?'));
                    tbody.append(
                        '<tr>' +
                        '<td>' + prodName + '</td>' +
                        '<td>$' + unitPrice.toFixed(2) + '</td>' +
                        '<td>' + qty + '</td>' +
                        '<td>$' + lineTotal.toFixed(2) + '</td>' +
                        '</tr>'
                    );
                });
                $('#detail-grand-total').text('$' + grandTotal.toFixed(2));

                // Show details view
                $('#orders-list-view').hide();
                $('#order-details-view').show();
                $('#update-success').text('');
                $('#update-error').text('');
            },
            error: function() { $('#list-error').text('Failed to load order details.'); }
        });
    });

    // Update order status
    $('#update-order-form').on('submit', function(e) {
        e.preventDefault();
        const orderId = $('#update-order-id').val();
        const status = $('#update-status').val();

        $.ajax({
            url: API + '/api/orders/' + orderId,
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify({ status: status }),
            success: function() {
                $('#update-success').text('Order status updated! Email notification sent.');
                // Reload order details to reflect new status
                $('.view-order-btn[data-order-id="' + orderId + '"]').trigger('click');
                loadOrders();
            },
            error: function(xhr) {
                $('#update-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Failed to update order.');
            }
        });
    });

    // Back to list
    $('#back-to-list-btn').on('click', function() {
        $('#order-details-view').hide();
        $('#orders-list-view').show();
    });

    loadOrders();
});
