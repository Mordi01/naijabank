const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2
        }).format(amount);
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000;
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    },

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    validatePhone(phone) {
        return /^0[7-9][0-1][0-9]{8}$/.test(phone);
    },

    validateBVN(bvn) {
        return /^\d{11}$/.test(bvn);
    }
};