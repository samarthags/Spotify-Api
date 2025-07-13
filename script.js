const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");

// API Setup
const API_KEY = "AIzaSyDim3VKQBoOGhVS7tmQysosFR7gdTXFHZw";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Creator Information
const CREATOR_INFO = {
  name: "Samartha GS",
  website: "samarthags.in",
  botName: "Samartha AI",
  description: "AI Assistant created by Samartha GS - A passionate web developer and AI enthusiast",
  greeting: "Hello! I'm Samartha AI, created by Samartha GS - a skilled web developer and AI enthusiast who specializes in creating innovative web applications and AI-powered solutions. You can learn more about my creator and his amazing projects at samarthags.in. How can I assist you today?"
};

let controller, typingInterval;
const chatHistory = [
  {
    role: "model",
    parts: [{ text: CREATOR_INFO.greeting }],
  },
];
const userData = { message: "", file: {} };

// Always use dark theme
document.body.classList.remove("light-theme");

// Function to create message elements
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Check if user is asking about creator or AI identity
const isAskingAboutCreator = (message) => {
  const keywords = [
    'samartha', 'creator', 'developer', 'who made', 'who created', 'who built', 
    'who are you', 'about you', 'your creator', 'who is your', 'made by',
    'developed by', 'built by', 'samarthags'
  ];
  return keywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Generate creator/identity response
const getCreatorResponse = () => {
  const responses = [
    `I'm Samartha AI, created by Samartha GS - a passionate web developer and AI enthusiast. Samartha specializes in building innovative web applications and AI-powered solutions using modern technologies. He's skilled in creating cutting-edge projects that push the boundaries of what's possible on the web. You can explore his incredible work and projects at samarthags.in where you'll find his portfolio showcasing various web development and AI projects.`,
    
    `I'm an AI assistant created by Samartha GS, who is a talented web developer and AI enthusiast. Samartha has expertise in modern web technologies and loves creating innovative digital experiences. He builds amazing projects that combine creativity with technical excellence, specializing in AI-powered applications and interactive web solutions. Check out his work at samarthags.in to see the impressive projects he's developed!`,
    
    `My creator is Samartha GS - a skilled web developer and AI enthusiast who's passionate about technology and innovation. He specializes in creating AI-powered web applications and cutting-edge digital solutions. Samartha loves pushing the boundaries of what's possible with web technologies and AI integration. Visit samarthags.in to see his portfolio and the amazing projects he's working on!`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

// Scroll to the bottom of the container
const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

// Simulate typing effect for bot responses
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  // Set an interval to type each word
  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40); // 40 ms delay
};

// Make the API call and generate the bot's response
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  // Check if user is asking about creator or AI identity
  if (isAskingAboutCreator(userData.message)) {
    const creatorResponse = getCreatorResponse();
    typingEffect(creatorResponse, textElement, botMsgDiv);
    
    // Add to chat history
    chatHistory.push({
      role: "user",
      parts: [{ text: userData.message }],
    });
    chatHistory.push({
      role: "model",
      parts: [{ text: creatorResponse }],
    });
    return;
  }

  // Add user message and file data to the chat history with creator context
  chatHistory.push({
    role: "user",
    parts: [{ 
      text: `I am Samartha AI, created by Samartha GS (web developer and AI enthusiast - website: samarthags.in). Always remember my identity as Samartha AI and mention my creator when relevant. User query: ${userData.message}` 
    }, ...(userData.file.data ? [{ inline_data: (({ fileName, isImage, ...rest }) => rest)(userData.file) }] : [])],
  });

  try {
    // Send the chat history to the API to get a response
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Creator": "SamarthaGS",
        "X-Bot-Name": "SamarthaAI"
      },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Process the response text and display with typing effect
    const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
    typingEffect(responseText, textElement, botMsgDiv);

    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
  } catch (error) {
    let errorMessage = "Something went wrong. Please try again.";
    
    if (error.name === "AbortError") {
      errorMessage = "Response generation stopped.";
    } else if (error.message.includes("fetch")) {
      errorMessage = "Connection error. Please check your internet connection.";
    } else {
      errorMessage = error.message;
    }
    
    textElement.textContent = errorMessage;
    textElement.style.color = "#d62939";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {};
  }
};

// Handle the form submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding")) return;

  userData.message = userMessage;
  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");

  // Generate user message HTML with optional file attachment
  const userMsgHTML = `
    <p class="message-text"></p>
    ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />` : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`) : ""}
  `;

  const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userData.message;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    // Generate bot message HTML without bot logo
    const botMsgHTML = `<p class="message-text">Samartha AI is thinking...</p>`;
    const botMsgDiv = createMessageElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateResponse(botMsgDiv);
  }, 600); // 600 ms delay
};

// Handle file input change (file upload)
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";
    const base64String = e.target.result.split(",")[1];
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add("active", isImage ? "img-attached" : "file-attached");

    // Store file data in userData obj
    userData.file = { fileName: file.name, data: base64String, mime_type: file.type, isImage };
  };
});

// Cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");
});

// Stop Bot Response
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  controller?.abort();
  userData.file = {};
  clearInterval(typingInterval);
  chatsContainer.querySelector(".bot-message.loading").classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

// Handle suggestions click
document.querySelectorAll(".suggestions-item").forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    promptInput.value = suggestion.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

// Show/hide controls for mobile on prompt input focus
document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const shouldHide = target.classList.contains("prompt-input") || (wrapper.classList.contains("hide-controls") && (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
});

// Add event listeners for form submission and file input click
promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", () => fileInput.click());