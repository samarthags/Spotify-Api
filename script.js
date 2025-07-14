document.getElementById("login").addEventListener("click", () => {
  window.location.href = "/api/login";
});

window.onload = async () => {
  const hash = window.location.hash;
  if (hash.includes("access_token")) {
    document.getElementById("login").style.display = "none";
    document.getElementById("results").style.display = "block";

    const token = hash.split("=")[1];

    const topTracksRes = await fetch("/api/top-tracks", {
      headers: { Authorization: token }
    });
    const topTracks = await topTracksRes.json();

    const list = document.getElementById("top-tracks");
    topTracks.items.forEach((track) => {
      const li = document.createElement("li");
      li.textContent = `${track.name} by ${track.artists[0].name}`;
      list.appendChild(li);
    });

    const nowPlayingRes = await fetch("/api/currently-playing", {
      headers: { Authorization: token }
    });
    const nowPlaying = await nowPlayingRes.json();
    if (nowPlaying && nowPlaying.item) {
      document.getElementById("now-playing").textContent =
        `${nowPlaying.item.name} by ${nowPlaying.item.artists[0].name}`;
    } else {
      document.getElementById("now-playing").textContent = "Nothing playing right now.";
    }
  }
};