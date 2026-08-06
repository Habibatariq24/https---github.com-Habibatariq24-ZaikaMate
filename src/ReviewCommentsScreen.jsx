import React, { useEffect, useState } from "react";
import "./styles.css";
import {
  fetchRecipeRatingSummary,
  fetchRecipeComments,
  postRecipeComment,
  postRecipeRating,
  fetchUserRecipeRating,
} from "./api/recipeapi";

export default function ReviewCommentsScreen({ navigation, recipeName }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [authToken, setAuthToken] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);

  const [ratingSummary, setRatingSummary] = useState({
    average_rating: 0,
    ratings_count: 0,
  });

  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [ratingError, setRatingError] = useState("");
  const [error, setError] = useState("");

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }

    return date.toLocaleString();
  };

  const loadSession = () => {
    const savedSession = localStorage.getItem("authSession");

    if (!savedSession) {
      setAuthToken("");
      setCurrentUsername("");
      return;
    }

    try {
      const session = JSON.parse(savedSession);
      setAuthToken(session?.access_token || "");
      setCurrentUsername(session?.user?.username || "");
    } catch {
      setAuthToken("");
      setCurrentUsername("");
    }
  };

  const loadComments = async (showLoader = true) => {
    try {
      if (showLoader) setCommentsLoading(true);

      const data = await fetchRecipeComments(recipeName);
      setComments(data || []);
      setError("");
    } catch {
      setError("Unable to load comments right now.");
    } finally {
      if (showLoader) setCommentsLoading(false);
    }
  };

  const loadRatingSummary = async () => {
    try {
      setRatingLoading(true);

      const summary = await fetchRecipeRatingSummary(recipeName);
      setRatingSummary(
        summary || {
          average_rating: 0,
          ratings_count: 0,
        }
      );

      setRatingError("");
    } catch {
      setRatingError("Unable to load ratings right now.");
    } finally {
      setRatingLoading(false);
    }
  };

  const loadUserRating = async () => {
    if (!authToken) {
      setSelectedRating(0);
      return;
    }

    try {
      const userRating = await fetchUserRecipeRating(recipeName, authToken);
      setSelectedRating(userRating?.rating || 0);
    } catch {
      setSelectedRating(0);
    }
  };

  const onSubmitRating = async () => {
    if (!authToken) {
      setRatingError("Please login to submit rating.");
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      setRatingError("Select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setRatingSubmitting(true);

      await postRecipeRating({
        recipe_id: recipeName,
        rating: selectedRating,
        token: authToken,
      });

      setRatingError("");
      await loadRatingSummary();
    } catch {
      setRatingError("Failed to submit rating.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const onPostComment = async () => {
    const cleanedComment = commentText.trim();

    if (!cleanedComment) {
      setError("Comment must not be empty.");
      return;
    }

    if (!authToken) {
      setError("Please login to post comments.");
      return;
    }

    try {
      setPostLoading(true);

      await postRecipeComment({
        recipe_id: recipeName,
        content: cleanedComment,
        token: authToken,
      });

      setCommentText("");
      setError("");
      await loadComments(false);
    } catch {
      setError("Failed to post comment.");
    } finally {
      setPostLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    loadComments(true);
    loadRatingSummary();

    const refreshTimer = setInterval(() => {
      loadComments(false);
      loadRatingSummary();
    }, 30000);

    return () => clearInterval(refreshTimer);
  }, [recipeName]);

  useEffect(() => {
    loadUserRating();
  }, [authToken, recipeName]);

  return (
    <div className="review-page">
      <div className="review-screen">
        <div className="review-header">
          <button
            className="review-back-top"
            onClick={() => navigation.navigate("recipedetail", { recipeName })}
          >
            ← Back
          </button>

          <h1>Review & Comments</h1>
          <p>{recipeName}</p>
        </div>

        <div className="review-content">
          <div className="review-card">
            <h2>Recipe Rating</h2>

            {ratingLoading ? (
              <div className="small-loader"></div>
            ) : (
              <p className="rating-summary">
                Average: {Number(ratingSummary.average_rating || 0).toFixed(1)} / 5 (
                {ratingSummary.ratings_count || 0} ratings)
              </p>
            )}

            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={
                    selectedRating >= star ? "star-button active" : "star-button"
                  }
                  onClick={() => setSelectedRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <button
              className="review-post-btn"
              onClick={onSubmitRating}
              disabled={ratingSubmitting}
            >
              {ratingSubmitting ? "Saving..." : "Submit Rating"}
            </button>

            {ratingError && <p className="review-error">{ratingError}</p>}
          </div>

          <div className="review-card">
            <h2>Share Recipe Tips</h2>

            {currentUsername && (
              <p className="posting-user">Posting as {currentUsername}</p>
            )}

            <textarea
              className="comment-input"
              placeholder="Write your cooking tip, experience, or modification"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />

            <button
              className="review-post-btn"
              onClick={onPostComment}
              disabled={postLoading}
            >
              {postLoading ? "Posting..." : "Post Tip"}
            </button>

            {error && <p className="review-error">{error}</p>}
          </div>

          <div className="review-card">
            <h2>Comments</h2>

            {commentsLoading ? (
              <div className="small-loader"></div>
            ) : (
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="empty-comments">
                    No comments yet. Be the first to share!
                  </p>
                ) : (
                  comments.map((item) => (
                    <div className="comment-card" key={item.id}>
                      <h3>{item.user_id}</h3>
                      <span>{formatDate(item.created_at)}</span>
                      <p>{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            className="review-bottom-back"
            onClick={() => navigation.navigate("recipedetail", { recipeName })}
          >
            Back to Recipe
          </button>
        </div>
      </div>
    </div>
  );
}