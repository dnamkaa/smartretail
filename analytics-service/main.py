from app import create_app

app = create_app()

@app.get("/")
def home():
    return {"message": "Analytics Service Running 📊"}

if __name__ == "__main__":
    app.run(debug=True, port=5005)
