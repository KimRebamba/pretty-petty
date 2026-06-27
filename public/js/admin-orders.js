$(document).ready(function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
        window.location.href = '/index.html?msg=admin_required';
        return;
    }

    (function() {
        const params = new URLSearchParams(window.location.search);
        const msg = params.get('msg');
        if (msg) {
            const $banner = $('#alert-banner');
            let text = msg.replace(/_/g, ' ');
            $banner.text(text).show();
            setTimeout(function() { $banner.slideUp(); }, 5000);
            if (window.history.replaceState) {
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    })();

    function initUserState() {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const t = localStorage.getItem('token');
        if (t && u && u.id) {
            $('#nav-user').css('display', 'flex');
            const fullName = (u.first_name || '') + ' ' + (u.last_name || '');
            $('#user-display-name').text(fullName || 'Admin');
            if (u.image_path) $('#user-avatar').attr('src', u.image_path);
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

    PrettyPettyUI.initButtons('#logout-link, #back-to-list-btn, #update-status-btn');
    PrettyPettyUI.initSelectmenu('#update-status, #filter-status, #filter-trashed');

    $('#order-tabs').tabs({ disabled: [1] });

    let ordersTable;

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function loadOrders() {
        const params = [];
        const status = $('#filter-status').val();
        const trashed = $('#filter-trashed').val();
        if (status) params.push('status=' + encodeURIComponent(status));
        if (trashed === 'true') params.push('includeDeleted=true');
        let url = API + '/api/orders' + (params.length ? '?' + params.join('&') : '');

        $.ajax({
            url: url,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(res) {
                const orders = (Array.isArray(res) ? res : []).map(function(o) {
                    const customer = o.User ? o.User.first_name + ' ' + o.User.last_name : 'User #' + (o.user_id || '-');
                    const isDeleted = !!o.deleted_at;
                    const actions = isDeleted
                        ? '<button class="restore-btn" data-id="' + o.id + '">Restore</button>'
                        : '<button class="view-order-btn" data-order-id="' + o.id + '">View</button>';
                    return {
                        DT_RowId: 'row_' + o.id,
                        DT_RowClass: isDeleted ? 'deleted-row' : '',
                        id: o.id,
                        customer: customer,
                        status: o.status,
                        date: formatDate(o.created_at),
                        actions: actions
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

    $('#filter-status, #filter-trashed').on('change', function() { loadOrders(); });

    $(document).on('click', '.restore-btn', function() {
        const id = $(this).attr('data-id');
        PrettyPettyUI.confirm('Restore this order?', function() {
            $.ajax({
                url: API + '/api/orders/' + id + '/restore',
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    PrettyPettyUI.flashMessage('#list-success', 'Order restored.', 'success');
                    $('#list-error').text('');
                    loadOrders();
                },
                error: function(xhr) {
                    PrettyPettyUI.flashMessage('#list-error', xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Restore failed.', 'error');
                    $('#list-success').text('');
                }
            });
        });
    });

    $(document).on('click', '.view-order-btn', function() {
        const orderId = $(this).attr('data-order-id');
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

                $('#order-tabs').tabs('enable', 1);
                $('#order-tabs').tabs('option', 'active', 1);
                PrettyPettyUI.refreshSelectmenu('#update-status');
                $('#update-success').text('');
                $('#update-error').text('');
            },
            error: function(xhr) {
                const msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Failed to load order details.';
                $('#list-error').text(msg);
            }
        });
    });

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
                PrettyPettyUI.flashMessage('#update-success', 'Order status updated! Email notification sent.');
                $('.view-order-btn[data-order-id="' + orderId + '"]').trigger('click');
                loadOrders();
            },
            error: function(xhr) {
                $('#update-error').text(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Failed to update order.');
            }
        });
    });

    $('#back-to-list-btn').on('click', function() {
        $('#order-tabs').tabs('option', 'active', 0);
        $('#order-tabs').tabs('disable', 1);
    });

    loadOrders();
});
