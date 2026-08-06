from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import Base, engine
from models import Comment, Rating, RecipeCache, RecipeListCache, User
from routes.auth_routes import router as auth_router
from routes.comment_routes import router as comment_router
from routes.rating_routes import router as rating_router
from routes.recipe_routes import router as recipe_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Recipe API",
    version="1.0.0"
)

# Create database tables
Base.metadata.create_all(bind=engine)

# CORS settings
# Frontend usually runs on localhost:5173 in Vite React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recipe_router, prefix="/api")
app.include_router(auth_router)
app.include_router(comment_router)
app.include_router(rating_router)


@app.get("/")
async def root():
    return {"message": "Recipe API is running!"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 5000))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )