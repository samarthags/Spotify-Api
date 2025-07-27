// script.js

document.addEventListener("DOMContentLoaded", async () => {
  const topSongsEl = document.getElementById("top-songs");
  const topArtistsEl = document.getElementById("top-artists");
  const listeningTimeEl = document.getElementById("listening-time");
  const profilePicEl = document.getElementById("profile-pic");
  const monthLabelEl = document.getElementById("month-label");
  const monthNameEl = document.getElementById("month-name");

  const month = new Date().toLocaleString("default", { month: "long" });
  const year = new Date().getFullYear();
  monthLabelEl.textContent = `${month} ${year}`;
  monthNameEl.textContent = month;

  try {
    // Fetch top tracks
    const tracksRes = await fetch("/api/top-tracks?time_range=short_term&limit=5");
    const tracksData = await tracksRes.json();

    tracksData.tracks.forEach((track, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1} ${track.name}`;
      topSongsEl.appendChild(li);
    });

    // Fetch top artists
    const artistsRes = await fetch("/api/top-artists?time_range=short_term&limit=5");
    const artistsData = await artistsRes.json();

    artistsData.artists.forEach((artist, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1} ${artist.name}`;
      topArtistsEl.appendChild(li);
    });

    // Fetch profile
    const profileRes = await fetch("/api/profile");
    const profileData = await profileRes.json();
    if (profileData.images && profileData.images.length > 0) {
      profilePicEl.src = profileData.images[0].url;
    }

    // Fetch listening time
    const statsRes = await fetch("/api/stats");
    const statsData = await statsRes.json();
    listeningTimeEl.textContent = `${statsData.minutes.toLocaleString()} minutes`;
  } catch (err) {
    console.error("Error loading data", err);
  }

  // Download image
  document.getElementById("download-btn").addEventListener("click", () => {
    const card = document.getElementById("card");
    html2canvas(card).then(canvas => {
      const link = document.createElement("a");
      link.download = "spotify-sound-capsule.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });
});
