from app import create_app

# Initialize Flask app using factory
app = create_app()

@app.route("/")
def home():
    return {"message": "Product Service Running 🚀"}

if __name__ == "__main__":
    app.run(debug=True, port=5001)  # use 5001 since auth uses 5000
