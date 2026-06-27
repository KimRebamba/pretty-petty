$(document).ready(function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user) {
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
    let salesChart = null;
    let ordersChart = null;
    let categoriesChart = null;

    $('#logout-btn').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    function showDashboardError(message) {
        $('#dashboard-error').text(message);
    }

    function renderCharts(data) {
        if (typeof Chart === 'undefined') {
            showDashboardError('Chart.js failed to load. Check your internet connection and refresh.');
            return;
        }

        const salesData = data.monthlySales || [];
        const orderStatusData = data.orderStatuses || [];
        const categoryData = data.productsPerCategory || [];

        if (salesChart) salesChart.destroy();
        if (ordersChart) ordersChart.destroy();
        if (categoriesChart) categoriesChart.destroy();

        salesChart = new Chart(document.getElementById('sales-line-chart'), {
            type: 'line',
            data: {
                labels: salesData.length ? salesData.map(function (d) { return d.month; }) : ['No data'],
                datasets: [{
                    label: 'Monthly Sales ($)',
                    data: salesData.length ? salesData.map(function (d) { return d.total; }) : [0],
                    borderColor: '#3366ff',
                    backgroundColor: 'rgba(51, 102, 255, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: true } }
            }
        });

        ordersChart = new Chart(document.getElementById('orders-pie-chart'), {
            type: 'pie',
            data: {
                labels: orderStatusData.length ? orderStatusData.map(function (d) { return d.status; }) : ['No orders'],
                datasets: [{
                    data: orderStatusData.length ? orderStatusData.map(function (d) { return d.count; }) : [1],
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        categoriesChart = new Chart(document.getElementById('categories-bar-chart'), {
            type: 'bar',
            data: {
                labels: categoryData.length ? categoryData.map(function (d) { return d.category_name; }) : ['No categories'],
                datasets: [{
                    label: 'Products',
                    data: categoryData.length ? categoryData.map(function (d) { return d.count; }) : [0],
                    backgroundColor: '#4bc0c0'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }

    $.ajax({
        url: API + '/api/dashboard/stats',
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function (stats) {
            $('#stat-revenue').text(parseFloat(stats.totalRevenue || 0).toFixed(2));
            $('#stat-orders').text(stats.totalOrders || 0);
            $('#stat-users').text(stats.totalUsers || 0);
            $('#stat-products').text(stats.totalProducts || 0);
        },
        error: function () {
            showDashboardError('Failed to load dashboard stats.');
        }
    });

    $.ajax({
        url: API + '/api/dashboard/charts',
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function (data) {
            $('#dashboard-error').text('');
            renderCharts(data);
        },
        error: function (xhr) {
            const msg = (xhr.responseJSON && xhr.responseJSON.message) || xhr.responseJSON?.error || 'Failed to load chart data.';
            showDashboardError(msg);
        }
    });

    $.ajax({
        url: API + '/api/orders?limit=5',
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function (res) {
            const orders = Array.isArray(res) ? res : [];
            const tbody = $('#recent-orders-body').empty();
            if (orders.length === 0) {
                tbody.append('<tr><td colspan="5" style="text-align:center;">No recent orders</td></tr>');
                return;
            }
            orders.forEach(function (o) {
                const customer = o.User ? o.User.first_name + ' ' + o.User.last_name : 'User #' + (o.user_id || '-');
                const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-SG') : '-';
                tbody.append(
                    '<tr>' +
                    '<td>#' + o.id + '</td>' +
                    '<td>' + customer + '</td>' +
                    '<td>' + (o.status || '-') + '</td>' +
                    '<td>' + date + '</td>' +
                    '<td><a href="admin-orders.html">View Details</a></td>' +
                    '</tr>'
                );
            });
        },
        error: function () {
            $('#recent-orders-body').html('<tr><td colspan="5">Failed to load recent orders.</td></tr>');
        }
    });
});
