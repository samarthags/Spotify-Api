// Get access token from URL fragment
const hash = window.location.hash;
const token = new URLSearchParams(hash.substring(1)).get("access_token");

if (!token) {
  console.error("No access token found in URL");
} else {
  console.log("Access Token:", token);
  fetchTopTracks(token);
  fetchCurrentlyPlaying(token);
}

function fetchTopTracks(token) {
  fetch(`/api/top-tracks?access_token=${token}`)
    .then((res) => res.json())
    .then((data) => {
      const list = document.createElement("ul");
      const container = document.querySelector("h2:nth-of-type(1)");
      container.after(list);

      if (Array.isArray(data)) {
        data.forEach((track) => {
          const li = document.createElement("li");
          li.textContent = `${track.name} by ${track.artist}`;
          list.appendChild(li);
        });
      } else {
        list.textContent = "Failed to load top tracks.";
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
      const container = document.querySelector("h2:nth-of-type(2)");
      const p = document.createElement("p");
      container.after(p);

      if (data && data.name) {
        p.textContent = `${data.name} by ${data.artist}`;
      } else {
        p.textContent = "Nothing currently playing.";
      }
    })
    .catch((err) => {
      console.error("Currently playing error:", err);
    });
}