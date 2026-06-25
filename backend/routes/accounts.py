from flask import Blueprint, jsonify, session
from utils.database import db
from utils.decorators import login_required

accounts_bp = Blueprint('accounts', __name__)

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

@accounts_bp.route('/banks', methods=['GET'])
def get_banks():
    """Get list of all Nigerian banks"""
    return jsonify({
        'banks': list(NIGERIAN_BANKS.values())
    })

@accounts_bp.route('/verify/<bank_code>/<account_number>', methods=['GET'])
@login_required
def verify_external_account(bank_code, account_number):
    """
    Verify account with bank code and account number
    For NaijaBank (999): check internal database
    For other banks: simulate verification
    """
    if bank_code == '999':
        # Internal NaijaBank transfer
        database = db.load()
        for user in database['users'].values():
            if user['account_number'] == account_number:
                return jsonify({
                    'valid': True,
                    'name': f'{user["first_name"]} {user["last_name"]}',
                    'account_number': account_number,
                    'bank': 'NaijaBank',
                    'bank_code': '999'
                })
        return jsonify({'valid': False, 'error': 'Account not found'}), 404
    
    # External bank verification (simulated)
    if bank_code in NIGERIAN_BANKS and len(account_number) == 10:
        bank = NIGERIAN_BANKS[bank_code]
        # Simulate name enquiry
        fake_names = {
            '0': 'ADEBAYO', '1': 'CHUKWUMA', '2': 'FATIMAT', '3': 'IBRAHIM',
            '4': 'JAMES', '5': 'KHADIJAT', '6': 'MICHAEL', '7': 'NGOZI',
            '8': 'OLUWASEUN', '9': 'PETER'
        }
        first_letter = fake_names.get(account_number[0], 'CUSTOMER')
        last_letter = fake_names.get(account_number[-1], 'USER')
        simulated_name = f'{first_letter} {last_letter}'
        
        return jsonify({
            'valid': True,
            'name': simulated_name,
            'account_number': account_number,
            'bank': bank['name'],
            'bank_code': bank_code
        })
    
    return jsonify({'valid': False, 'error': 'Invalid bank or account number'}), 400

@accounts_bp.route('/dark-mode', methods=['POST'])
@login_required
def toggle_dark_mode():
    """Toggle user's dark mode preference"""
    database = db.load()
    user = database['users'].get(session['email'])
    user['dark_mode'] = not user.get('dark_mode', False)
    db.save(database)
    return jsonify({'dark_mode': user['dark_mode']})