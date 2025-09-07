from app import create_app

# Initialize Flask app
app = create_app()

@app.route("/")
def home():
    return {"message": "Order Service Running 🚀"}

if __name__ == "__main__":
    app.run(debug=True, port=5002)  # Order-Service on 5002
