document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");

  // 🔐 Handle login button
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/api/login";
    });
  }

  // 🔓 Extract token from URL
  const hash = window.location.hash;
  const token = new URLSearchParams(hash.substring(1)).get("access_token");

  if (token) {
    fetchUserProfile(token);
    fetchTopTracks(token);
    fetchCurrentlyPlaying(token);
    fetchListeningTime(token);
  }
});

// 👤 Fetch Spotify user profile
function fetchUserProfile(token) {
  fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((profile) => {
      const profileDiv = document.getElementById("profile");
      profileDiv.style.display = "flex";

      document.getElementById("display-name").textContent = profile.display_name || "Spotify User";

      if (profile.images && profile.images.length > 0) {
        document.getElementById("profile-pic").src = profile.images[0].url;
      }
    })
    .catch((err) => {
      console.error("Profile error:", err);
    });
}

// 🎵 Fetch top 5 tracks
function fetchTopTracks(token) {
  fetch(`/api/top-tracks?access_token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("top-songs");
      list.innerHTML = "";

      if (Array.isArray(data)) {
        data.forEach((track, index) => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="index">${index + 1}</span> ${track.name} by ${track.artist}`;
          list.appendChild(li);
        });
      } else {
        list.textContent = "Could not load top tracks.";
      }
    })
    .catch((err) => {
      console.error("Top tracks error:", err);
    });
}

// 🎧 Fetch currently playing song
function fetchCurrentlyPlaying(token) {
  fetch(`/api/currently-playing?access_token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      const nowPlaying = document.getElementById("now-playing");

      if (data && data.name && data.artist) {
        nowPlaying.textContent = `🎶 ${data.name} by ${data.artist}`;
      } else {
        nowPlaying.textContent = "Nothing is currently playing.";
      }
    })
    .catch((err) => {
      console.error("Currently playing error:", err);
    });
}

// ⏱ Fetch recent listening time
function fetchListeningTime(token) {
  fetch(`/api/recently-played?access_token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      const timeElement = document.getElementById("listening-time");

      if (data && data.totalMinutes) {
        timeElement.innerHTML = `You've listened for <strong>${data.totalMinutes} minutes</strong> recently 🎧`;
      } else {
        timeElement.textContent = "Could not calculate listening time.";
      }
    })
    .catch((err) => {
      console.error("Listening time error:", err);
    });
}