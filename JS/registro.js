document.getElementById("registroForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!usuario || !correo || !password) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor completa todos los campos.',
        });
        return;
    }

    // Simulación de registro exitoso
    Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: 'Te has registrado correctamente.',
        confirmButtonText: 'Iniciar sesión'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '..Autenticacion/login.html'; // redirigir a login
        }
    });
});