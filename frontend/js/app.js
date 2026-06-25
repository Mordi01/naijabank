document.addEventListener('DOMContentLoaded', () => {
    Auth.checkSession();
    
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') Auth.login();
    });
});