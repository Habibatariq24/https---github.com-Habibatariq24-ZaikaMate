# 🍳 ZaikaMate — AI-Powered Interactive Cooking Assistant

<p align="center">
  <img src="main.jpeg" alt="ZaikaMate Logo" width="220"/>
</p>

<p align="center">
  <b>Cook Smarter with AI</b><br>
  An AI-powered interactive cooking assistant that recommends Pakistani recipes, guides users through voice-based cooking instructions, and features an animated AI chef avatar.
</p>

<p align="center">

![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)
![Three.js](https://img.shields.io/badge/3D-Three.js-black?logo=three.js)
![LiveKit](https://img.shields.io/badge/Voice-LiveKit-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

</p>

---

# 📖 About

**ZaikaMate** is an AI-powered interactive cooking assistant developed as our **Final Year Project** at **FAST National University of Computer and Emerging Sciences (FAST NUCES), Lahore**.

Instead of simply displaying recipes, ZaikaMate provides an engaging cooking experience by combining **Artificial Intelligence, Speech Technologies, NLP, and an Interactive 3D Avatar**.

Users can search for recipes using available ingredients, receive cooking guidance through an AI chef, and follow voice-assisted step-by-step instructions.

---

# ✨ Features

- 🤖 AI-powered recipe recommendations
- 🥘 Ingredient-based recipe search
- 🍛 Pakistani recipe collection
- 🎙️ Voice-guided cooking instructions
- 👨‍🍳 Interactive AI Chef Avatar
- 🔊 Text-to-Speech using ElevenLabs
- 🎤 Speech interaction through LiveKit
- ⭐ Recipe ratings and reviews
- 💬 Comments and feedback system
- 🔐 Secure Login & Signup
- ⚡ Fast React + Vite frontend
- 🐍 FastAPI backend

---

# 📸 Screenshots

## 🚀 User Journey

| Login | Home | Main Screen |
|:------:|:----:|:-----------:|
| <img src="login.png" width="250"/> | <img src="mainscreen.png" width="250"/> | <img src="homescreen.jpeg" width="250"/> |

| Recipes | Recipe Details | Cooking Steps |
|:------:|:--------------:|:-------------:|
| <img src="recipefetch.png" width="250"/> | <img src="recipes.png" width="250"/> | <img src="recipesteps.png" width="250"/> |

| AI Cooking Avatar | Reviews & Comments |
|:----------------:|:------------------:|
| <img src="avatarscreen.jpeg" width="300"/> | <img src="review and comments.png" width="300"/> |

# 🛠 Tech Stack

| Category | Technologies |
|-----------|--------------|
| Frontend | React, Vite, JavaScript |
| Backend | FastAPI, Python |
| AI & NLP | OpenAI API, LangChain |
| Voice | LiveKit, ElevenLabs |
| 3D Avatar | Three.js, React Three Fiber, VRM |
| Authentication | JWT |
| Styling | CSS |
| Development | VS Code, Git, GitHub |

---

# 📂 Project Structure

```text
ZaikaMate
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   └── hooks/
│
├── public/
│
├── backend/
│   ├── agent.py
│   └── main.py
│
├── recipe_fastapi_backend/
│   ├── routes/
│   ├── models/
│   ├── database/
│   └── main.py
│
├── package.json
├── vite.config.js
├── README.md
└── .env
```

---

# 🏗 System Architecture

```text
                    User
                      │
                      ▼
             React + Vite Frontend
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
 Authentication   FastAPI API   LiveKit Voice
        │             │             │
        ▼             ▼             ▼
     User Data    Recipe Engine   ElevenLabs
                      │
                      ▼
              Interactive AI Avatar
```

---

# 🚀 Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/Habibatariq24/ZaikaMate.git
cd ZaikaMate
```

---

## 2. Install Frontend Dependencies

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Application runs at:

```
http://localhost:5173
```

---

## 3. Start FastAPI Backend

```bash
cd recipe_fastapi_backend

pip install -r requirements.txt

python main.py
```

---

## 4. Run LiveKit Backend

```bash
cd backend

pip install -r requirements.txt

python main.py
```

or

```bash
python agent.py dev
```

---

## 5. Start LiveKit Server

```bash
livekit-server --dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the project root.

```env
VITE_LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
ELEVENLABS_API_KEY=
OPENAI_API_KEY=
```

> ⚠️ Never upload your `.env` file to GitHub.

---

# 🧠 How It Works

1. Users sign up or log in to the application.
2. Enter the ingredients available at home.
3. ZaikaMate recommends suitable Pakistani recipes and highlights any missing ingredients.
4. Users can explore recipe details, ingredients, and cooking instructions.
5. The AI cooking avatar provides interactive voice guidance while cooking.
6. Users can rate recipes, leave reviews, and share feedback.

---

# 🚀 Future Improvements

- 📱 Android & iOS mobile application
- 🌍 Multi-language support
- 📷 Ingredient recognition using computer vision
- ❤️ Personalized recipe recommendations
- 🥗 Nutritional information
- 🛒 Grocery shopping integration
- 📅 Meal planning
- 🍽️ AI meal suggestions based on dietary preferences

---

# 👩‍💻 Authors

### Habiba Tariq
BS Data Science  
FAST National University of Computer & Emerging Sciences (FAST NUCES), Lahore

GitHub: https://github.com/Habibatariq24

---

### Amna Habib

BS Data Science  
FAST National University of Computer & Emerging Sciences (FAST NUCES), Lahore

---

### Asma Fatima

BS Data Science  
FAST National University of Computer & Emerging Sciences (FAST NUCES), Lahore

---

# 🙏 Acknowledgements

Special thanks to our project supervisor and the faculty of **FAST NUCES, Lahore** for their continuous guidance and support throughout the development of ZaikaMate.

---

# 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
Made with ❤️ using AI, React, FastAPI, LiveKit, and Three.js
</p>
