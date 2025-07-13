const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");

document.body.classList.remove("light-theme");
localStorage.setItem("themeColor", "dark_mode");

const API_KEYS = [
  "AIzaSyDPiBB6pS4P6aNDNYx-QTSvoDW1oP94Ld4",
  "AIzaSyB6uwGq7g-test-test-key1",
  "AIzaSyD-test-test-test-key2"
];
const API_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

const CREATOR_INFO = {
  name: "Samartha GS",
  website: "https://samarthags.in",
  signature: "Over-Powered-Sam AI by Samartha GS",
  botName: "OPS",
  botfullName: "Over Powered Sam",
  creatorBio:
    "Samartha GS is a talented web developer and AI enthusiast who specializes in creating innovative web applications and AI-powered solutions. You can explore his work and projects at samarthags.in",
};

let controller, typingInterval;
let messageCount = 0;
const MESSAGE_LIMIT = 5;

const chatHistory = [
  {
    role: "model",
    parts: [
      {
        text: `Hello! I'm OPS, created by Samartha GS - a skilled web developer and AI enthusiast. You can learn more about my creator at samarthags.in. I'm here to help you with any questions or tasks you might have. How can I assist you today?`,
      },
    ],
  },
];

const userData = {
  message: "",
  file: {},
};

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const isAskingAboutSamartha = (message) => {
  const keywords = ["samartha", "creator", "developer", "who made", "who built", "who created", "who is"];
  return keywords.some((word) => message.toLowerCase().includes(word));
};

const getSamarthaResponse = () => {
  const replies = [
    `Samartha GS is my creator - a passionate web developer and AI enthusiast. Check his projects at samarthags.in.`,
    `Samartha GS is a talented developer in web & AI. He created me (OPS)! Visit samarthags.in to see more.`,
    `I was built by Samartha GS — an amazing developer! Explore his work at samarthags.in.`,
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};

const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let i = 0;
  typingInterval = setInterval(() => {
    if (i < words.length) {
      textElement.textContent += (i === 0 ? "" : " ") + words[i++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40);
};

const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  // Show limit message after 5th user message
  if (messageCount > MESSAGE_LIMIT) {
    const limitMsg = `There are limits to patience 😅 Your today's free limit ends. Come back tomorrow or explore premium @samarthags.in</a>.`;
    typingEffect(limitMsg, textElement, botMsgDiv);
    return;
  }

  if (isAskingAboutSamartha(userData.message)) {
    const samarthaResponse = getSamarthaResponse();
    typingEffect(samarthaResponse, textElement, botMsgDiv);
    chatHistory.push({ role: "user", parts: [{ text: userData.message }] });
    chatHistory.push({ role: "model", parts: [{ text: samarthaResponse }] });
    return;
  }

  const parts = [
    {
      text: `You are OverPowered AI, created by Samartha GS (web developer & AI enthusiast - samarthags.in). Respond as OverPowered AI. User asked: ${userData.message}`,
    },
  ];
  if (userData.file.data) {
    const { fileName, isImage, ...inlineData } = userData.file;
    parts.push({ inline_data: inlineData });
  }

  chatHistory.push({ role: "user", parts });

  try {
    const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
    const res = await fetch(API_URL(apiKey), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Creator": "SamarthaGS",
        "X-Bot-Name": "OverPoweredSamAI",
        Referer: CREATOR_INFO.website,
      },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to fetch");

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?.replace(/\*\*([^*]+)\*\*/g, "$1")
      .trim();

    typingEffect(responseText, textElement, botMsgDiv);
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
  } catch (error) {
    const errorMsg =
      error.name === "AbortError"
        ? "Response stopped."
        : error.message.includes("fetch")
        ? "Connection error. Please check your internet."
        : error.message;

    textElement.textContent = errorMsg;
    textElement.style.color = "#d62939";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {};
  }
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  const msg = promptInput.value.trim();
  if (!msg || document.body.classList.contains("bot-responding")) return;

  userData.message = msg;
  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");

  const fileHTML = userData.file.data
    ? userData.file.isImage
      ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
      : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`
    : "";

  const userHTML = `<p class="message-text"></p>${fileHTML}`;
  const userMsgDiv = createMessageElement(userHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userData.message;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    const botHTML = `<img class="avatar" src="gemini.svg" /> <p class="message-text">OPS is thinking...</p>`;
    const botMsgDiv = createMessageElement(botHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateResponse(botMsgDiv);
  }, 600);

  messageCount++;
};

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    fileInput.value = "";
    const base64 = e.target.result.split(",")[1];
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add("active", isImage ? "img-attached" : "file-attached");

    userData.file = {
      fileName: file.name,
      data: base64,
      mime_type: file.type,
      isImage,
    };
  };
});

document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");
});

document.querySelector("#stop-response-btn").addEventListener("click", () => {
  controller?.abort();
  userData.file = {};
  clearInterval(typingInterval);
  const loading = chatsContainer.querySelector(".bot-message.loading");
  if (loading) loading.classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

document.querySelectorAll(".suggestions-item").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const hide =
    target.classList.contains("prompt-input") ||
    (wrapper.classList.contains("hide-controls") &&
      (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", hide);
});

promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", () => fileInput.click());