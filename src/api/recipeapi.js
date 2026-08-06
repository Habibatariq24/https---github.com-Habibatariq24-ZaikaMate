const BASE_URL = "http://localhost:5000";
      // const BASE_URL =     "https://m7lsvbn2-5000.inc1.devtunnels.ms/";
//const BASE_URL = "https://m7lsvbn2-5000.inc1.devtunnels.ms";

/* ================= AUTH ================= */

export async function loginUser({ email, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw { response: { data: err } };
  }

  return await res.json();
}

export async function signupUser({ username, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw { response: { data: err } };
  }

  return await res.json();
}

/* ================= RECIPES LIST ================= */

export async function fetchRecipesList(ingredients, hasCommonSpices) {
  try {
    const res = await fetch(`${BASE_URL}/api/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ingredients: ingredients,
        has_common_spices: hasCommonSpices,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Recipe list backend error:", err);
      throw { response: { data: err } };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}

/* ================= RECIPE DETAIL ================= */

export async function fetchRecipeDetail(recipeName) {
  try {
    const res = await fetch(`${BASE_URL}/api/recipe-detail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipeName: recipeName,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Recipe detail backend error:", err);
      throw { response: { data: err } };
    }

    const data = await res.json();
    return data.recipe || "";
  } catch (error) {
    console.error("Error fetching recipe detail:", error);
    return "";
  }
}

/* ================= RECIPE STEPS ================= */

export async function fetchRecipeSteps(recipeName) {
  try {
    const res = await fetch(`${BASE_URL}/api/recipe-steps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipeName: recipeName,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Recipe steps backend error:", err);
      throw { response: { data: err } };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching recipe steps:", error);
    return [];
  }
}

/* ================= REVIEWS / COMMENTS / RATINGS ================= */

export async function fetchRecipeComments(recipeName) {
  try {
    const res = await fetch(
      `${BASE_URL}/comments/${encodeURIComponent(recipeName)}`
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Comments backend error:", err);
      throw { response: { data: err } };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function postRecipeComment({ recipe_id, content, token }) {
  const res = await fetch(`${BASE_URL}/comments/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipe_id,
      content,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Post comment backend error:", err);
    throw { response: { data: err } };
  }

  return await res.json();
}

export async function fetchRecipeRatingSummary(recipeName) {
  try {
    const res = await fetch(
      `${BASE_URL}/ratings/${encodeURIComponent(recipeName)}`
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("Rating summary backend error:", err);
      throw { response: { data: err } };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching rating summary:", error);
    return {
      average_rating: 0,
      ratings_count: 0,
    };
  }
}

export async function fetchUserRecipeRating(recipeName, token) {
  try {
    const res = await fetch(
      `${BASE_URL}/ratings/${encodeURIComponent(recipeName)}/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      return { rating: 0 };
    }

    return await res.json();
  } catch {
    return { rating: 0 };
  }
}

export async function postRecipeRating({ recipe_id, rating, token }) {
  const res = await fetch(`${BASE_URL}/ratings/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipe_id,
      rating,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Post rating backend error:", err);
    throw { response: { data: err } };
  }

  return await res.json();
}