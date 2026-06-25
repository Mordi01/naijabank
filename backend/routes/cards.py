from flask import Blueprint, request, jsonify, session
from utils.database import db
from utils.decorators import login_required
from utils.helpers import generate_card_number, generate_card_cvv, get_timestamp

cards_bp = Blueprint('cards', __name__)

@cards_bp.route('/add', methods=['POST'])
@login_required
def add_card():
    data = request.get_json()
    database = db.load()
    user = database['users'].get(session['email'])
    
    card = {
        'id': str(generate_account_number()),
        'card_number': generate_card_number(),
        'cvv': generate_card_cvv(),
        'expiry_month': data.get('expiry_month', '12'),
        'expiry_year': data.get('expiry_year', str(2028)),
        'card_type': data.get('card_type', 'visa'),
        'nickname': data.get('nickname', 'My Card'),
        'status': 'active',
        'added_at': get_timestamp()
    }
    
    user['cards'].append(card)
    db.save(database)
    
    return jsonify({
        'card': card,
        'message': 'Card added successfully'
    })

@cards_bp.route('/remove/<card_id>', methods=['DELETE'])
@login_required
def remove_card(card_id):
    database = db.load()
    user = database['users'].get(session['email'])
    user['cards'] = [c for c in user['cards'] if c['id'] != card_id]
    db.save(database)
    return jsonify({'message': 'Card removed successfully'})