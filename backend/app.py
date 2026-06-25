from flask import Flask
from flask_cors import CORS
from config import Config
from routes.auth import auth_bp
from routes.accounts import accounts_bp
from routes.transactions import transactions_bp
from routes.cards import cards_bp
from routes.owner import owner_bp

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, supports_credentials=True)

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(accounts_bp, url_prefix='/api/accounts')
app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
app.register_blueprint(cards_bp, url_prefix='/api/cards')
app.register_blueprint(owner_bp, url_prefix='/api/owner')

if __name__ == '__main__':
    app.run(debug=True, port=5000)