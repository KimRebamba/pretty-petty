$(document).ready(function () {
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

    $('#logout-link').on('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    const API = PrettyPettyUI.apiBase;

    PrettyPettyUI.initButtons('#logout-link');
    let salesChart = null;
    let ordersChart = null;
    let categoriesChart = null;

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
                    borderColor: '#1a1a1a',
                    backgroundColor: 'rgba(26, 26, 26, 0.06)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 1.5,
                    pointRadius: 2,
                    pointBackgroundColor: '#1a1a1a'
                }]
            },
            options: {
    responsive: true,
    maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f0f0ee' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#888' } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#888' } }
                }
            }
        });

        ordersChart = new Chart(document.getElementById('orders-pie-chart'), {
            type: 'pie',
            data: {
                labels: orderStatusData.length ? orderStatusData.map(function (d) { return d.status; }) : ['No orders'],
                datasets: [{
                    data: orderStatusData.length ? orderStatusData.map(function (d) { return d.count; }) : [1],
                    backgroundColor: ['#1a1a1a', '#888', '#d0d0d0', '#f5f5f3']
                }]
            },
            options: {
    responsive: true,
    maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, color: '#888', padding: 16 } } }
            }
        });

        categoriesChart = new Chart(document.getElementById('categories-bar-chart'), {
            type: 'bar',
            data: {
                labels: categoryData.length ? categoryData.map(function (d) { return d.category_name; }) : ['No categories'],
                datasets: [{
                    label: 'Products',
                    data: categoryData.length ? categoryData.map(function (d) { return d.count; }) : [0],
                    backgroundColor: '#1a1a1a',
                    borderRadius: 3,
                    barPercentage: 0.6
                }]
            },
            options: {
    responsive: true,
    maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter', size: 11 }, color: '#888' }, grid: { color: '#f0f0ee' } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#888' } }
                }
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
