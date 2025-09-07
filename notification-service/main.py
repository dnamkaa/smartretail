from app import create_app

app = create_app()

@app.get("/")
def home():
    return {"message": "Notification Service Running "}

if __name__ == "__main__":
    app.run(debug=True, port=5004)
