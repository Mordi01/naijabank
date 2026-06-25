from flask import Blueprint, jsonify
from utils.database import db

owner_bp = Blueprint('owner', __name__)

@owner_bp.route('/dashboard', methods=['GET'])
def owner_dashboard():
    database = db.load()
    
    return jsonify({
        'owner_account': database['owner'],
        'total_users': len(database['users']),
        'total_transactions': len(database['transactions']),
        'platform_stats': {
            'total_volume': sum(abs(tx['amount']) for tx in database['transactions']),
            'total_charges_earned': database['owner']['total_charges_collected']
        }
    })