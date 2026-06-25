import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'naijabank-dev-secret-key-change-in-production'
    # Use /tmp for Render's ephemeral filesystem
    DATA_FILE = os.path.join('/tmp', 'bank_data.json')
    OWNER_ACCOUNT = {
        'account_number': '9999999999',
        'name': 'Bank Owner',
        'balance': 0.00,
        'total_charges_collected': 0.00
    }
    FREE_TRANSFERS = 5
    CHARGE_AFTER_FREE = 10
    CHARGE_HIGH_AMOUNT = 50
    HIGH_AMOUNT_THRESHOLD = 10000