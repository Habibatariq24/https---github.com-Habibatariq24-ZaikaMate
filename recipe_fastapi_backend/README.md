# Recipe FastAPI Backend

FastAPI backend for the Recipe Avatar application with Gemini AI integration.

## 🚀 Setup & Installation

### 1. Install Python Dependencies

```bash
cd recipe_fastapi_backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Edit the `.env` file with your API keys:

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/recipeavatar
```

For local SQLite fallback, use:

```
DATABASE_URL=sqlite:///./recipes.db
```

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
python main.py
```

**Or using uvicorn directly:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

The server will start at `http://localhost:5000`

## 📡 API Endpoints

### 1. Get Recipe List
- **Endpoint:** `POST /api/get-recipes`
- **Body:**
  ```json
  {
    "ingredients": "chicken, rice, tomatoes"
  }
  ```
- **Response:** Array of 10 Pakistani recipes

### 2. Get Recipe Detail
- **Endpoint:** `POST /api/get-recipe-detail`
- **Body:**
  ```json
  {
    "recipeName": "Chicken Biryani"
  }
  ```
- **Response:** Detailed recipe with ingredients and instructions

### 3. Add Comment
- **Endpoint:** `POST /comments/`
- **Body:**
  ```json
  {
    "recipe_id": "Chicken Biryani",
    "user_id": "Ali",
    "content": "I added lemon juice at the end and it tasted great."
  }
  ```

### 4. Get Comments for Recipe
- **Endpoint:** `GET /comments/{recipe_id}`
- **Response:** Array of comments with `id`, `recipe_id`, `user_id`, `content`, `created_at`

## 🔧 Testing the API

### Using curl:
```bash
# Get recipes
curl -X POST http://localhost:5000/api/get-recipes \
  -H "Content-Type: application/json" \
  -d '{"ingredients": "chicken, rice"}'

# Get recipe detail
curl -X POST http://localhost:5000/api/get-recipe-detail \
  -H "Content-Type: application/json" \
  -d '{"recipeName": "Chicken Biryani"}'

# Add comment
curl -X POST http://localhost:5000/comments/ \
  -H "Content-Type: application/json" \
  -d '{"recipe_id": "Chicken Biryani", "user_id": "Ali", "content": "Great recipe!"}'

# Get recipe comments
curl http://localhost:5000/comments/Chicken%20Biryani
```

### Using FastAPI Interactive Docs:
Open your browser and go to:
- **Swagger UI:** `http://localhost:5000/docs`
- **ReDoc:** `http://localhost:5000/redoc`

## 🌐 Using with ngrok

If you need to expose your local server (for React Native):

```bash
ngrok http 5000
```

Then update the `BASE_URL` in your React Native app (`src/api/recipeapi.js`) with the ngrok URL.

## 📦 Project Structure

```
recipe_fastapi_backend/
├── main.py                 # FastAPI app entry point
├── routes/
│   └── recipe_routes.py   # API route definitions
├── controllers/
│   └── recipe_controller.py  # Business logic & Gemini AI calls
├── .env                    # Environment variables
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🔒 Security Note

⚠️ **Never commit your `.env` file to version control!** Add it to `.gitignore`.

## 🆚 Differences from Express Backend

- **Language:** Python instead of JavaScript
- **Framework:** FastAPI instead of Express
- **HTTP Client:** httpx (async) instead of axios
- **Type Safety:** Pydantic models for request/response validation
- **Auto Docs:** Built-in Swagger UI at `/docs`
- **Async by default:** All endpoints are asynchronous

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env or run on different port
uvicorn main:app --reload --port 5001
```

**Import errors:**
```bash
# Make sure you're in the correct directory
cd recipe_fastapi_backend
pip install -r requirements.txt
```
