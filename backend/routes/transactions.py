from flask import Blueprint, request, jsonify, session
from utils.database import db
from utils.decorators import login_required
from utils.helpers import get_timestamp, generate_account_number
from utils.charges import calculate_transfer_charge
from flask_bcrypt import Bcrypt
NIGERIAN_BANKS = {
    '044': {'name': 'Access Bank', 'code': '044'},
    '023': {'name': 'Citibank', 'code': '023'},
    '050': {'name': 'Ecobank', 'code': '050'},
    '011': {'name': 'First Bank', 'code': '011'},
    '214': {'name': 'First City Monument Bank (FCMB)', 'code': '214'},
    '070': {'name': 'Fidelity Bank', 'code': '070'},
    '058': {'name': 'Guaranty Trust Bank (GTB)', 'code': '058'},
    '030': {'name': 'Heritage Bank', 'code': '030'},
    '301': {'name': 'Jaiz Bank', 'code': '301'},
    '082': {'name': 'Keystone Bank', 'code': '082'},
    '076': {'name': 'Polaris Bank', 'code': '076'},
    '221': {'name': 'Stanbic IBTC', 'code': '221'},
    '068': {'name': 'Standard Chartered', 'code': '068'},
    '232': {'name': 'Sterling Bank', 'code': '232'},
    '100': {'name': 'SunTrust Bank', 'code': '100'},
    '032': {'name': 'Union Bank', 'code': '032'},
    '033': {'name': 'United Bank for Africa (UBA)', 'code': '033'},
    '215': {'name': 'Unity Bank', 'code': '215'},
    '035': {'name': 'Wema Bank', 'code': '035'},
    '057': {'name': 'Zenith Bank', 'code': '057'},
    '999': {'name': 'NaijaBank (Internal)', 'code': '999'},
}

transactions_bp = Blueprint('transactions', __name__)
bcrypt = Bcrypt()

@transactions_bp.route('/transfer', methods=['POST'])
@login_required
def transfer():
    """Process money transfer - supports both internal and inter-bank"""
    data = request.get_json()
    database = db.load()
    sender = database['users'].get(session['email'])
    
    amount = float(data.get('amount', 0))
    recipient_account = data.get('recipient_account')
    bank_code = data.get('bank_code', '999')
    description = data.get('description', 'Transfer')
    pin = data.get('pin', '')
    
    if not bcrypt.check_password_hash(sender['password'], pin):
        return jsonify({'error': 'Invalid PIN'}), 403
    
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400
    
    is_internal = (bank_code == '999')
    
    if is_internal:
        recipient = None
        for u in database['users'].values():
            if u['account_number'] == recipient_account:
                recipient = u
                break
        
        if not recipient:
            return jsonify({'error': 'Recipient account not found'}), 404
        
        if recipient['id'] == sender['id']:
            return jsonify({'error': 'Cannot transfer to your own account'}), 400
        
        charge = calculate_transfer_charge(amount, sender['transfer_count'])
        total_deduction = amount + charge
        
        if sender['balance'] < total_deduction:
            return jsonify({
                'error': f'Insufficient funds. You need ₦{total_deduction} (including ₦{charge} charge)'
            }), 400
        
        sender['balance'] -= total_deduction
        recipient['balance'] += amount
        sender['transfer_count'] += 1
        
        if charge > 0:
            database['owner']['balance'] += charge
            database['owner']['total_charges_collected'] += charge
        
        timestamp = get_timestamp()
        
        tx_id = str(generate_account_number())
        database['transactions'].append({
            'id': tx_id,
            'user_id': sender['id'],
            'type': 'transfer',
            'amount': -amount,
            'charge': charge,
            'description': f'Transfer to {recipient["first_name"]} {recipient["last_name"]} (NaijaBank)',
            'recipient_account': recipient_account,
            'recipient_name': f'{recipient["first_name"]} {recipient["last_name"]}',
            'bank': 'NaijaBank',
            'bank_code': '999',
            'balance_after': sender['balance'],
            'timestamp': timestamp,
            'status': 'completed'
        })
        
        database['transactions'].append({
            'id': str(generate_account_number()),
            'user_id': recipient['id'],
            'type': 'credit',
            'amount': amount,
            'description': f'Transfer from {sender["first_name"]} {sender["last_name"]} (NaijaBank)',
            'sender_account': sender['account_number'],
            'sender_name': f'{sender["first_name"]} {sender["last_name"]}',
            'bank': 'NaijaBank',
            'bank_code': '999',
            'balance_after': recipient['balance'],
            'timestamp': timestamp,
            'status': 'completed'
        })
        
        db.save(database)
        
        return jsonify({
            'message': 'Transfer successful',
            'amount': amount,
            'charge': charge,
            'new_balance': sender['balance'],
            'transaction_id': tx_id
        })
    
    else:
        interbank_charge = 50
        total_deduction = amount + interbank_charge
        
        if sender['balance'] < total_deduction:
            return jsonify({
                'error': f'Insufficient funds. You need ₦{total_deduction} (including ₦{interbank_charge} inter-bank charge)'
            }), 400
        
        sender['balance'] -= total_deduction
        sender['transfer_count'] += 1
        
        database['owner']['balance'] += interbank_charge
        database['owner']['total_charges_collected'] += interbank_charge
        
        bank_name = NIGERIAN_BANKS.get(bank_code, {}).get('name', 'External Bank')
        
        timestamp = get_timestamp()
        
        tx_id = str(generate_account_number())
        database['transactions'].append({
            'id': tx_id,
            'user_id': sender['id'],
            'type': 'interbank_transfer',
            'amount': -amount,
            'charge': interbank_charge,
            'description': f'Transfer to {recipient_account} ({bank_name})',
            'recipient_account': recipient_account,
            'recipient_name': data.get('recipient_name', 'Account Holder'),
            'bank': bank_name,
            'bank_code': bank_code,
            'balance_after': sender['balance'],
            'timestamp': timestamp,
            'status': 'completed'
        })
        
        db.save(database)
        
        return jsonify({
            'message': f'Inter-bank transfer to {bank_name} successful',
            'amount': amount,
            'charge': interbank_charge,
            'new_balance': sender['balance'],
            'transaction_id': tx_id
        })

@transactions_bp.route('/deposit', methods=['POST'])
@login_required
def deposit():
    data = request.get_json()
    database = db.load()
    user = database['users'].get(session['email'])
    
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    user['balance'] += amount
    
    database['transactions'].append({
        'id': str(generate_account_number()),
        'user_id': user['id'],
        'type': 'deposit',
        'amount': amount,
        'description': data.get('description', 'Cash Deposit'),
        'balance_after': user['balance'],
        'timestamp': get_timestamp(),
        'status': 'completed'
    })
    
    db.save(database)
    return jsonify({
        'message': 'Deposit successful',
        'new_balance': user['balance']
    })

@transactions_bp.route('/withdraw', methods=['POST'])
@login_required
def withdraw():
    data = request.get_json()
    database = db.load()
    user = database['users'].get(session['email'])
    
    amount = float(data.get('amount', 0))
    pin = data.get('pin', '')
    
    if not bcrypt.check_password_hash(user['password'], pin):
        return jsonify({'error': 'Invalid PIN'}), 403
    
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if user['balance'] < amount:
        return jsonify({'error': 'Insufficient funds'}), 400
    
    user['balance'] -= amount
    
    database['transactions'].append({
        'id': str(generate_account_number()),
        'user_id': user['id'],
        'type': 'withdrawal',
        'amount': -amount,
        'description': data.get('description', 'ATM Withdrawal'),
        'balance_after': user['balance'],
        'timestamp': get_timestamp(),
        'status': 'completed'
    })
    
    db.save(database)
    return jsonify({
        'message': 'Withdrawal successful',
        'new_balance': user['balance']
    })

@transactions_bp.route('/history', methods=['GET'])
@login_required
def get_history():
    database = db.load()
    user = database['users'].get(session['email'])
    
    user_transactions = [
        tx for tx in database['transactions']
        if tx['user_id'] == user['id']
    ]
    
    user_transactions.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({'transactions': user_transactions[:50]})