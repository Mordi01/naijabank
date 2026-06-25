from flask import Blueprint, request, jsonify, session # type: ignore
import flask_bcrypt # type: ignore
from utils.database import db
from utils.helpers import generate_account_number, get_timestamp

auth_bp = Blueprint('auth', __name__)
bcrypt = flask_bcrypt.Bcrypt()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['first_name', 'last_name', 'email', 'phone', 'password', 'bvn']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    database = db.load()
    
    if data['email'] in database['users']:
        return jsonify({'error': 'Email already registered'}), 409
    
    user_id = str(generate_account_number())
    account_number = generate_account_number()
    
    user = {
        'id': user_id,
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'email': data['email'],
        'phone': data['phone'],
        'bvn': data['bvn'],
        'password': bcrypt.generate_password_hash(data['password']).decode('utf-8'),
        'account_number': account_number,
        'balance': 5000.00,
        'cards': [],
        'created_at': get_timestamp(),
        'dark_mode': False,
        'transfer_count': 0
    }
    
    database['users'][data['email']] = user
    
    database['transactions'].append({
        'id': str(generate_account_number()),
        'user_id': user_id,
        'type': 'credit',
        'amount': 5000.00,
        'description': 'Welcome Bonus',
        'balance_after': 5000.00,
        'timestamp': get_timestamp(),
        'status': 'completed'
    })
    
    db.save(database)
    
    return jsonify({
        'message': 'Registration successful',
        'account_number': account_number,
        'balance': 5000.00
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    database = db.load()
    
    user = database['users'].get(data.get('email'))
    if not user or not bcrypt.check_password_hash(user['password'], data.get('password', '')):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    session['user_id'] = user['id']
    session['email'] = user['email']
    
    return jsonify({
        'user': {
            'id': user['id'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'email': user['email'],
            'account_number': user['account_number'],
            'balance': user['balance'],
            'dark_mode': user['dark_mode'],
            'cards': user['cards']
        }
    })

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/user', methods=['GET'])
def get_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    database = db.load()
    user = database['users'].get(session['email'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': {
            'id': user['id'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'email': user['email'],
            'phone': user['phone'],
            'account_number': user['account_number'],
            'balance': user['balance'],
            'dark_mode': user['dark_mode'],
            'cards': user['cards'],
            'transfer_count': user['transfer_count']
        }
    })