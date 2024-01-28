import { URL } from "./constants";

const checkResponse = (res) => {
  if (res.ok) {
    return res.text().then(text => text ? JSON.parse(text) : {});
  }
  return res.json().then((err) => Promise.reject(err));
};

const headersWithContentType = { "Content-Type": "application/json" };

export const registerUser = (username, password) => {
  return fetch(`${URL}/api/users/register/`, {
    method: "POST",
    headers: headersWithContentType,
    body: JSON.stringify({ username, password }),
  }).then(checkResponse);
};

export const loginUser = (username, password) => {
  return fetch(`${URL}/api/token/login/`, {
    method: "POST",
    headers: headersWithContentType,
    body: JSON.stringify({ username, password }),
  })
    .then(checkResponse)
    .then((data) => {
      if (data.auth_token) {
        localStorage.setItem("auth_token", data.auth_token);
        return data;
      }
      return null;
    });
};

export const logoutUser = () => {
  return fetch(`${URL}/api/token/logout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
  }).then((res) => {
    if (res.status === 204) {
      localStorage.removeItem("auth_token");
      return res;
    }
    return null;
  });
};

export const getUser = () => {
  return fetch(`${URL}/api/users/me/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
  }).then(checkResponse);
};

export const createReview = (reviewData) => {
  return fetch(`${URL}/api/reviews/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify(reviewData),
  }).then(checkResponse);
};

export const getUserReviews = () => {
  return fetch(`${URL}/api/reviews/user_reviews/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
  }).then(checkResponse);
};

export const deleteReview = (reviewId) => {
  return fetch(`${URL}/api/reviews/${reviewId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
  }).then(checkResponse);
};

export const updateReview = (reviewId, reviewData) => {
  return fetch(`${URL}/api/reviews/${reviewId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify(reviewData),
  }).then(checkResponse);
};

export const updateUser = (userData) => {
  return fetch(`${URL}/api/users/me/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify(userData),
  }).then(checkResponse);
};

export const getPublicProfiles = () => {
  return fetch(`${URL}/api/public-profiles/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
  }).then(checkResponse);
};


export const sendFriendRequest = (friendId) => {
  return fetch(`${URL}/api/send-friend-request/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify({ friend_id: friendId }),
  }).then(checkResponse);
};


export const cancelFriendRequest = (friendId) => {
  return fetch(`${URL}/api/cancel-friend-request/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify({ friend_id: friendId }),
  }).then(checkResponse);
};

export const removeFriend = (friendId) => {
  return fetch(`${URL}/api/users/remove-friend/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify({ friend_id: friendId }),
  }).then(checkResponse);
};


export const acceptFriendRequest = (friendId) => {
  return fetch(`${URL}/api/users/accept-friend-request/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify({ friend_id: friendId }),
  }).then(checkResponse);
};

export const getFriendsReviews = () => {
  return fetch(`${URL}/api/reviews/friends_reviews/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: `Token ${localStorage.getItem("auth_token")}`,
    },
  }).then(checkResponse);
};
