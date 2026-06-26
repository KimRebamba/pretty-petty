$('#registerForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('first_name', $('input[name="first_name"]').val());
    formData.append('last_name', $('input[name="last_name"]').val());
    formData.append('email', $('input[name="email"]').val());
    formData.append('password', $('input[name="password"]'));
    formData.append('image', $('input[name="image"]')[0].files[0]);
    formData.append('delivery_address', $('input[name="delivery_address"]').val());

    console.log("HELL");
    $.ajax({
        url: 'http://localhost:3000/api/auth/register',
        method: 'POST',
        data: formData,
        processData: false, 
        contentType: false, 
        success: function(res) {
            alert(res.message);
            //window.location.href = '/login.html';
        },
        error: function(err) {
            alert(err.responseJSON.message);
        }
    });
});