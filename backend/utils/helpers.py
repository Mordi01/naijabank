import uuid
from datetime import datetime

def generate_account_number():
    return str(uuid.uuid4().int)[:10]

def generate_card_number():
    digits = str(uuid.uuid4().int)[:16]
    return ' '.join([digits[i:i+4] for i in range(0, 16, 4)])

def generate_card_cvv():
    return str(uuid.uuid4().int)[:3]

def get_timestamp():
    return datetime.now().isoformat()