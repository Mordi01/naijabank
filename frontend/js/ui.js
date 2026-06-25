const UI = {
    showDashboard() {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        this.updateDashboard();
        Transactions.loadHistory();
    },

    updateDashboard() {
        if (!Auth.currentUser) return;
        
        const user = Auth.currentUser;
        document.getElementById('mainBalance').textContent = Utils.formatCurrency(user.balance);
        document.getElementById('accountNumber').textContent = user.account_number;
        document.getElementById('navUserName').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('cardAccountNumber').textContent = user.account_number;
        document.getElementById('cardHolderName').textContent = `${user.first_name} ${user.last_name}`.toUpperCase();
        document.getElementById('freeTransfersLeft').textContent = Math.max(0, 5 - (user.transfer_count || 0));
        
        Cards.render();
    },

    showSection(type) {
        this.hideAllForms();
        const sectionId = type === 'cards' ? 'cardsSection' : type + 'Form';
        const el = document.getElementById(sectionId);
        el.classList.remove('hidden-section');
        el.classList.add('active-section');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    hideAllForms() {
        ['transferForm', 'depositForm', 'withdrawForm', 'cardsSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden-section');
                el.classList.remove('active-section');
            }
        });
    },

    renderTransactions(transactions) {
        const container = document.getElementById('transactionsList');
        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No transactions yet</p>';
            return;
        }
        
        container.innerHTML = transactions.slice(0, 10).map(tx => {
            const isCredit = tx.amount > 0;
            return `
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer border-b border-gray-100 dark:border-dark-border last:border-0"
                     onclick="UI.showTxDetails('${tx.id}', '${encodeURIComponent(JSON.stringify(tx))}')">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas ${isCredit ? 'fa-arrow-down' : 'fa-arrow-up'} ${isCredit ? 'text-green-600' : 'text-red-600'} text-sm"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="font-medium text-gray-800 dark:text-white text-sm truncate">${tx.description}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${Utils.formatDate(tx.timestamp)}</p>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-2">
                        <p class="font-semibold text-sm ${isCredit ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}">
                            ${isCredit ? '+' : ''}${Utils.formatCurrency(Math.abs(tx.amount))}
                        </p>
                        ${tx.charge > 0 ? `<span class="text-xs text-red-500">Fee: ₦${tx.charge}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    showTxDetails(txId, txData) {
        const tx = JSON.parse(decodeURIComponent(txData));
        const isCredit = tx.amount > 0;
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="text-center mb-6">
                <div class="w-16 h-16 ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas ${isCredit ? 'fa-arrow-down' : 'fa-arrow-up'} ${isCredit ? 'text-green-600' : 'text-red-600'} text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">${tx.description}</h3>
                <p class="text-3xl font-bold ${isCredit ? 'text-green-600' : 'text-gray-800 dark:text-white'} mt-2">
                    ${isCredit ? '+' : ''}${Utils.formatCurrency(Math.abs(tx.amount))}
                </p>
            </div>
            <div class="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Date</span>
                    <span class="font-medium dark:text-white">${new Date(tx.timestamp).toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Type</span>
                    <span class="font-medium capitalize dark:text-white">${tx.type}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Status</span>
                    <span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">Completed</span>
                </div>
                ${tx.charge > 0 ? `
                <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span class="text-gray-500 dark:text-gray-400">Transfer Fee</span>
                    <span class="font-medium text-red-600">₦${tx.charge}</span>
                </div>
                ` : ''}
                <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span class="text-gray-500 dark:text-gray-400">Balance After</span>
                    <span class="font-medium dark:text-white">${Utils.formatCurrency(tx.balance_after)}</span>
                </div>
            </div>
        `;
        
        document.getElementById('modal').classList.remove('hidden');
        document.getElementById('modal').classList.add('flex');
    },

    calculateMonthlyStats(transactions) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        let spent = 0, received = 0;
        transactions.forEach(tx => {
            const txDate = new Date(tx.timestamp);
            if (txDate >= monthStart) {
                if (tx.amount < 0) spent += Math.abs(tx.amount);
                else received += tx.amount;
            }
        });
        
        document.getElementById('monthlySpent').textContent = Utils.formatCurrency(spent);
        document.getElementById('monthlyReceived').textContent = Utils.formatCurrency(received);
    },

    async toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        document.body.classList.toggle('dark');
        
        if (Auth.currentUser) {
            await fetch(`${CONFIG.API_BASE_URL}/accounts/dark-mode`, {
                method: 'POST',
                credentials: 'include'
            });
        }
        
        const icon = document.getElementById('darkModeIcon');
        icon.className = isDark ? 'fas fa-sun text-xl text-yellow-400' : 'fas fa-moon text-xl';
    },

    applyDarkMode(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            document.getElementById('darkModeIcon').className = 'fas fa-sun text-xl text-yellow-400';
        }
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');
        
        msg.textContent = message;
        const icons = {
            success: 'fa-check-circle text-green-400',
            error: 'fa-times-circle text-red-400',
            info: 'fa-info-circle text-blue-400'
        };
        icon.className = `fas ${icons[type]}`;
        
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
    },

    showNotification() {
        this.showToast('No new notifications', 'info');
    },

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('modal').classList.remove('flex');
    }
};

document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) UI.closeModal();
});