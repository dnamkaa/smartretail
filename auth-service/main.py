from app import create_app

app = create_app()

@app.route("/")
def home():
    name = "doto namkaa"
    return {"message": f"Auth Service is Up and Running 🚀, @  {name}"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
