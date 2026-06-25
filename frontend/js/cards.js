const Cards = {
    render() {
        const container = document.getElementById('cardsList');
        const cards = Auth.currentUser?.cards || [];
        
        if (cards.length === 0) {
            container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No cards added yet</p>';
            return;
        }
        
        container.innerHTML = cards.map(card => `
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 text-white relative overflow-hidden">
                <div class="flex justify-between items-start mb-4">
                    <span class="font-bold italic">${card.card_type.toUpperCase()}</span>
                    <button onclick="Cards.remove('${card.id}')" class="text-white/70 hover:text-white">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="font-mono text-lg tracking-wider mb-4">${card.card_number}</p>
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-xs text-white/70">Card Holder</p>
                        <p class="font-medium text-sm">${Auth.currentUser.first_name} ${Auth.currentUser.last_name}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-white/70">Expires</p>
                        <p class="font-mono text-sm">${card.expiry_month}/${card.expiry_year}</p>
                    </div>
                </div>
            </div>
        `).join('');
    },

    async addCard() {
        const data = {
            nickname: document.getElementById('cardNickname').value,
            card_type: document.getElementById('cardType').value,
            expiry_year: document.getElementById('cardExpiryYear').value
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/cards/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            if (res.ok) {
                Auth.currentUser.cards.push(result.card);
                this.render();
                document.getElementById('cardNickname').value = '';
                UI.showToast('Card added successfully', 'success');
            } else {
                UI.showToast(result.error, 'error');
            }
        } catch (e) {
            UI.showToast('Error adding card', 'error');
        }
    },

    async remove(cardId) {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/cards/remove/${cardId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (res.ok) {
                Auth.currentUser.cards = Auth.currentUser.cards.filter(c => c.id !== cardId);
                this.render();
                UI.showToast('Card removed', 'success');
            }
        } catch (e) {
            UI.showToast('Error removing card', 'error');
        }
    }
};