# payment-service/main.py
from app import create_app

app = create_app()

@app.route("/")
def home():
    return {"message": "Payment Service Running 🚀"}

if __name__ == "__main__":
    # Default port 5003 for Payment-Service
    app.run(debug=True, port=5003)
