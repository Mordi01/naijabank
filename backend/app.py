CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://naija-bank-123.netlify.app"  # YOUR NETLIFY URL
        ],
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})