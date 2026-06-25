const Auth = {
    currentUser: null,

    toggleForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm.classList.contains('hidden-section')) {
            loginForm.classList.remove('hidden-section');
            registerForm.classList.add('hidden-section');
        } else {
            loginForm.classList.add('hidden-section');
            registerForm.classList.remove('hidden-section');
        }
    },

    async register() {
        const data = {
            first_name: document.getElementById('regFirstName').value,
            last_name: document.getElementById('regLastName').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            bvn: document.getElementById('regBvn').value,
            password: document.getElementById('regPassword').value
        };

        if (!Utils.validateEmail(data.email)) {
            UI.showToast('Please enter a valid email', 'error');
            return;
        }
        if (!Utils.validatePhone(data.phone)) {
            UI.showToast('Please enter a valid Nigerian phone number (080...)', 'error');
            return;
        }
        if (!Utils.validateBVN(data.bvn)) {
            UI.showToast('BVN must be 11 digits', 'error');
            return;
        }

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            
            if (res.ok) {
                UI.showToast(`Account created! Number: ${result.account_number}`, 'success');
                this.toggleForm();
            } else {
                UI.showToast(result.error || 'Registration failed', 'error');
            }
        } catch (e) {
            UI.showToast('Network error. Is backend running?', 'error');
        }
    },

    async login() {
        const data = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            
            if (res.ok) {
                this.currentUser = result.user;
                UI.applyDarkMode(result.user.dark_mode);
                UI.showDashboard();
                UI.showToast('Welcome back!', 'success');
            } else {
                UI.showToast(result.error || 'Login failed', 'error');
            }
        } catch (e) {
            UI.showToast('Network error. Is backend on port 5000?', 'error');
        }
    },

    async logout() {
        await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        this.currentUser = null;
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('authScreen').classList.remove('hidden');
        UI.showToast('Logged out', 'info');
    },

    async checkSession() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/user`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                this.currentUser = data.user;
                UI.applyDarkMode(data.user.dark_mode);
                UI.showDashboard();
            }
        } catch (e) {
            console.log('No active session');
        }
    }
};