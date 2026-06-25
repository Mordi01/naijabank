import json
import os
from config import Config

class Database:
    def __init__(self):
        self.data_file = Config.DATA_FILE
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
    
    def load(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                return json.load(f)
        return {
            'users': {},
            'transactions': [],
            'owner': Config.OWNER_ACCOUNT.copy()
        }
    
    def save(self, data):
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)

db = Database()