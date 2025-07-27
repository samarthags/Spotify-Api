document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const hash = window.location.hash;
  const token = new URLSearchParams(hash.substring(1)).get("access_token");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/api/login";
    });
  }

  if (token) {
    fetchProfile(token);
    loadAllStats(token, "short_term"); // default
    fetchCurrentlyPlaying(token);
    fetchListeningTime(token);

    // Handle time range buttons
    document.querySelectorAll("#range-selector button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const range = btn.getAttribute("data-range");
        loadAllStats(token, range);
      });
    });

    document.getElementById("create-playlist-btn").addEventListener("click", () => {
      alert("This feature will generate your playlist soon! 🚀");
    });
  }
});

function loadAllStats(token, time_range) {
  fetchTopTracks(token, time_range);
  fetchTopArtists(token, time_range);
}

function fetchProfile(token) {
  fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: "Bearer " + token },
  })
    .then(res => res.json())
    .then(user => {
      const profileDiv = document.getElementById("profile");
      profileDiv.innerHTML = `
        <img src="${user.images?.[0]?.url || ''}" class="profile-pic" />
        <h2>${user.display_name}</h2>
        <p>${user.email}</p>
      `;
    });
}

function fetchTopTracks(token, range) {
  fetch(`/api/top-tracks?access_token=${token}&time_range=${range}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("songs-container");
      container.innerHTML = "";

      data.topTracks.forEach(track => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <img src="${track.albumArt}" alt="${track.name}" />
          <p><strong>${track.name}</strong></p>
          <p>${track.artist}</p>
        `;
        container.appendChild(div);
      });

      // Genres
      const genresList = document.getElementById("genres-list");
      genresList.innerHTML = "";
      data.genres.forEach(genre => {
        const li = document.createElement("li");
        li.textContent = genre;
        genresList.appendChild(li);
      });
    });
}

function fetchTopArtists(token, range) {
  fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${range}&limit=5`, {
    headers: { Authorization: "Bearer " + token },
  })
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("artists-list");
      list.innerHTML = "";
      data.items.forEach(artist => {
        const li = document.createElement("li");
        li.textContent = artist.name;
        list.appendChild(li);
      });
    });
}

function fetchCurrentlyPlaying(token) {
  fetch(`/api/currently-playing?access_token=${token}`)
    .then(res => res.json())
    .then(data => {
      const p = document.getElementById("now-playing");
      if (data && data.name && data.artist) {
        p.textContent = `🎧 ${data.name} by ${data.artist}`;
      } else {
        p.textContent = "Nothing is currently playing.";
      }
    });
}

function fetchListeningTime(token) {
  fetch(`/api/recently-played?access_token=${token}`)
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("listening-time");
      div.innerHTML = `<h2>Listening Time</h2>
        <p>You listened for <strong>${data.totalMinutes} minutes</strong> recently 🎶</p>`;
    });
}