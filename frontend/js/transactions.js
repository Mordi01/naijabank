const Transactions = {
    currentTab: 'internal', // 'internal' or 'external'
    banks: [],
    selectedBank: null,

    async loadBanks() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/accounts/banks`);
            const result = await res.json();
            this.banks = result.banks || [];
            
            const select = document.getElementById('bankSelect');
            select.innerHTML = '<option value="">-- Select a Bank --</option>';
            this.banks.forEach(bank => {
                if (bank.code !== '999') { // Don't show NaijaBank in external list
                    const option = document.createElement('option');
                    option.value = bank.code;
                    option.textContent = bank.name;
                    select.appendChild(option);
                }
            });
        } catch (e) {
            console.error('Failed to load banks');
        }
    },

    switchTab(tab) {
        this.currentTab = tab;
        const internalBtn = document.getElementById('tabInternal');
        const externalBtn = document.getElementById('tabExternal');
        const bankContainer = document.getElementById('bankSelectContainer');
        
        if (tab === 'internal') {
            internalBtn.className = 'flex-1 py-2 px-4 rounded-lg bg-primary text-white font-medium transition-colors';
            externalBtn.className = 'flex-1 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-600';
            bankContainer.classList.add('hidden');
            this.selectedBank = '999';
        } else {
            externalBtn.className = 'flex-1 py-2 px-4 rounded-lg bg-primary text-white font-medium transition-colors';
            internalBtn.className = 'flex-1 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-600';
            bankContainer.classList.remove('hidden');
            this.loadBanks();
            this.selectedBank = null;
        }
        
        // Clear previous verification
        document.getElementById('recipientName').classList.add('hidden');
        document.getElementById('recipientBank').classList.add('hidden');
        document.getElementById('transferTo').value = '';
        this.calculateCharges();
    },

    onBankChange() {
        const select = document.getElementById('bankSelect');
        this.selectedBank = select.value;
        document.getElementById('recipientName').classList.add('hidden');
        document.getElementById('recipientBank').classList.add('hidden');
    },

    async verifyRecipient() {
        const account = document.getElementById('transferTo').value;
        if (account.length !== 10) return;
        
        const bankCode = this.currentTab === 'internal' ? '999' : (this.selectedBank || '999');
        
        if (this.currentTab === 'external' && !this.selectedBank) {
            UI.showToast('Please select a bank first', 'error');
            return;
        }
        
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/accounts/verify/${bankCode}/${account}`, {
                credentials: 'include'
            });
            const result = await res.json();
            
            const nameEl = document.getElementById('recipientName');
            const bankEl = document.getElementById('recipientBank');
            
            if (result.valid) {
                nameEl.textContent = `Account Name: ${result.name}`;
                nameEl.classList.remove('hidden', 'text-red-600');
                nameEl.classList.add('text-green-600');
                
                bankEl.textContent = `Bank: ${result.bank}`;
                bankEl.classList.remove('hidden');
            } else {
                nameEl.textContent = 'Account not found';
                nameEl.classList.remove('hidden', 'text-green-600');
                nameEl.classList.add('text-red-600');
                bankEl.classList.add('hidden');
            }
        } catch (e) {}
    },

    calculateCharges() {
        const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
        const chargeInfo = document.getElementById('chargeInfo');
        
        if (this.currentTab === 'external') {
            // Inter-bank: always ₦50
            if (amount > 0) {
                chargeInfo.textContent = `₦50 inter-bank charge applies`;
                chargeInfo.className = 'text-xs text-orange-500 mt-1';
            } else {
                chargeInfo.textContent = '';
            }
            return;
        }
        
        // Internal NaijaBank transfer
        const freeLeft = Math.max(0, 5 - (Auth.currentUser?.transfer_count || 0));
        let message = '';

        if (amount > 10000) {
            message = `₦50 charge applies (transfer above ₦10,000)`;
        } else if (freeLeft === 0 && amount > 0) {
            message = `₦10 charge applies (free transfers used)`;
        } else if (amount > 0) {
            message = `Free transfer (${freeLeft} remaining)`;
        }

        chargeInfo.textContent = message;
        chargeInfo.className = 'text-xs text-gray-500 dark:text-gray-400 mt-1';
    },

    async processTransfer() {
        const data = {
            recipient_account: document.getElementById('transferTo').value,
            bank_code: this.currentTab === 'internal' ? '999' : this.selectedBank,
            amount: parseFloat(document.getElementById('transferAmount').value),
            description: document.getElementById('transferDesc').value,
            recipient_name: document.getElementById('recipientName').textContent.replace('Account Name: ', ''),
            pin: document.getElementById('transferPin').value
        };

        if (!data.recipient_account || data.recipient_account.length !== 10) {
            UI.showToast('Please enter a valid 10-digit account number', 'error');
            return;
        }

        if (this.currentTab === 'external' && !data.bank_code) {
            UI.showToast('Please select a bank', 'error');
            return;
        }

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/transactions/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            
            if (res.ok) {
                Auth.currentUser.balance = result.new_balance;
                Auth.currentUser.transfer_count = (Auth.currentUser.transfer_count || 0) + 1;
                UI.updateDashboard();
                this.loadHistory();
                UI.hideAllForms();
                
                const bankName = this.currentTab === 'internal' ? 'NaijaBank' : 'external bank';
                UI.showToast(`Transferred ${Utils.formatCurrency(result.amount)} to ${bankName} (Charge: ₦${result.charge})`, 'success');
                
                // Clear form
                document.getElementById('transferTo').value = '';
                document.getElementById('transferAmount').value = '';
                document.getElementById('transferDesc').value = '';
                document.getElementById('transferPin').value = '';
                document.getElementById('recipientName').classList.add('hidden');
                document.getElementById('recipientBank').classList.add('hidden');
                document.getElementById('bankSelect').value = '';
            } else {
                UI.showToast(result.error, 'error');
            }
        } catch (e) {
            UI.showToast('Transfer failed', 'error');
        }
    },

    async processDeposit() {
        const data = {
            amount: parseFloat(document.getElementById('depositAmount').value),
            description: document.getElementById('depositDesc').value
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/transactions/deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            if (res.ok) {
                Auth.currentUser.balance = result.new_balance;
                UI.updateDashboard();
                this.loadHistory();
                UI.hideAllForms();
                UI.showToast('Deposit successful', 'success');
                document.getElementById('depositAmount').value = '';
                document.getElementById('depositDesc').value = '';
            } else {
                UI.showToast(result.error, 'error');
            }
        } catch (e) {
            UI.showToast('Deposit failed', 'error');
        }
    },

    async processWithdraw() {
        const data = {
            amount: parseFloat(document.getElementById('withdrawAmount').value),
            pin: document.getElementById('withdrawPin').value
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/transactions/withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            if (res.ok) {
                Auth.currentUser.balance = result.new_balance;
                UI.updateDashboard();
                this.loadHistory();
                UI.hideAllForms();
                UI.showToast('Withdrawal successful', 'success');
                document.getElementById('withdrawAmount').value = '';
                document.getElementById('withdrawPin').value = '';
            } else {
                UI.showToast(result.error, 'error');
            }
        } catch (e) {
            UI.showToast('Withdrawal failed', 'error');
        }
    },

    async loadHistory() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/transactions/history`, {
                credentials: 'include'
            });
            const result = await res.json();
            UI.renderTransactions(result.transactions || []);
            UI.calculateMonthlyStats(result.transactions || []);
        } catch (e) {
            console.error('Failed to load transactions');
        }
    }
};