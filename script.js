document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/api/login";
    });
  }

  const hash = window.location.hash;
  const token = new URLSearchParams(hash.substring(1)).get("access_token");

  if (token) {
    fetchTopTracks(token);
    fetchCurrentlyPlaying(token);
    fetchListeningTime(token); // ✅ New Feature
  }
});

function fetchTopTracks(token) {
  fetch(`/api/top-tracks?access_token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      const h2 = document.querySelector("h2:nth-of-type(1)");
      const list = document.createElement("ul");
      h2.after(list);

      if (Array.isArray(data)) {
        data.forEach((track) => {
          const li = document.createElement("li");
          li.textContent = `${track.name} by ${track.artist}`;
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

function fetchCurrentlyPlaying(token) {
  fetch(`/api/currently-playing?access_token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      const h2 = document.querySelector("h2:nth-of-type(2)");
      const p = document.createElement("p");
      h2.after(p);

      if (data && data.name && data.artist) {
        p.textContent = `🎧 Now playing: ${data.name} by ${data.artist}`;
      } else {
        p.textContent = "Nothing is currently playing.";
      }
    })
    .catch((err) => {
      console.error("Currently playing error:", err);
    });
}

function fetchListeningTime(token) {
  fetch(`/api/recently-played?access_token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      const statBox = document.createElement("div");
      statBox.className = "section";
      statBox.innerHTML = `<h2>Listening Time</h2>
        <p>You've listened to music for <strong>${data.totalMinutes} minutes</strong> recently 🎧</p>`;
      document.body.appendChild(statBox);
    })
    .catch((err) => {
      console.error("Listening time error:", err);
    });
}