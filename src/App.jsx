import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import SplashScreen from "./SplashScreen";
import HomeScreen from "./HomeScreen";
import MainScreen from "./MainScreen";
import Avatar from "./speaktoavatarscreen";
import LoginScreen from "./LoginScreen";
import SignupScreen from "./SignupScreen";
import Ingredient from "./Ingredientscreen";
import RecipeListScreen from "./RecipeListScreen";
import RecipeDetailScreen from "./RecipeDetailScreen";
import RecipeStepsScreen from "./RecipeStepsScreen";
import ReviewCommentsScreen from "./ReviewCommentsScreen";
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [user, setUser] = useState(null);
  const [screenData, setScreenData] = useState({});

  useEffect(() => {
    if (screen === "splash") {
      const timer = setTimeout(() => {
        setScreen("home");
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const navigate = (screenName, data) => {
    if (data?.user) setUser(data.user);
    if (data) setScreenData(data);
    setScreen(screenName);
  };

  return (
    <>
      {screen === "splash" && <SplashScreen />}

      {screen === "home" && (
        <HomeScreen navigation={{ navigate }} />
      )}

      {screen === "login" && (
        <LoginScreen navigation={{ navigate }} />
      )}

      {screen === "signup" && (
        <SignupScreen navigation={{ navigate }} />
      )}

      {screen === "main" && (
        <MainScreen navigation={{ navigate }} user={user} />
      )}

      {screen === "ingredient" && (
           <Ingredient navigation={{ navigate }} />
      )}

    {screen === "avatar" && (
  <Avatar navigation={{ navigate }} />
)}

      {screen === "recipelist" && (
       <RecipeListScreen
         navigation={{ navigate }}
         ingredients={screenData.ingredients || ""}
        hasCommonSpices={screenData.hasCommonSpices || false}
      />
)}
  {screen === "recipedetail" && (
  <RecipeDetailScreen
    navigation={{ navigate }}
    recipeName={screenData.recipeName || ""}
  />
)}

{screen === "steps" && (
  <RecipeStepsScreen
    navigation={{ navigate }}
    recipeName={screenData.recipeName || ""}
  />
)}

{screen === "reviewcomments" && (
<ReviewCommentsScreen
navigation={{ navigate }}
recipeName={screenData.recipeName || ""}
/>
)}
    </>
  );
}