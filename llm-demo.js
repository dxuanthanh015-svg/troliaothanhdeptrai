const dom = {
  apiBase: document.getElementById("apiBase"),
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  saveConfigBtn: document.getElementById("saveConfigBtn"),
  status: document.getElementById("status"),
  messages: document.getElementById("messages"),
  chatForm: document.getElementById("chatForm"),
  prompt: document.getElementById("prompt"),
  sendBtn: document.getElementById("sendBtn"),
  clearBtn: document.getElementById("clearBtn")
};

const STORAGE_KEY = "llm_demo_config_v1";
const SYSTEM_PROMPT =
  "Bạn là trợ lý Ảo AI của Thành đẹp trai, trả lời ngắn gọn và thân thiện";

let chatHistory = [
  { role: "system", content: SYSTEM_PROMPT }
];

function setStatus(text, type = "idle") {
  dom.status.textContent = text;
  dom.status.className = "status " + type;
}

function addMessage(role, content) {
  const messageEl = document.createElement("div");
  messageEl.className = "message " + role;
  messageEl.textContent = content;
  dom.messages.appendChild(messageEl);
  dom.messages.scrollTop = dom.messages.scrollHeight;
}

function saveConfig() {
  const config = {
    apiBase: dom.apiBase.value.trim(),
    apiKey: dom.apiKey.value.trim(),
    model: dom.model.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  setStatus("Đã lưu cấu hình");
}

function loadConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const config = JSON.parse(raw);
    dom.apiBase.value = config.apiBase || "https://api.groq.com/openai/v1";
    dom.apiKey.value = config.apiKey || "";
    dom.model.value = config.model || "llama-3.1-8b-instant";
  } catch (error) {
    console.error("Đọc config thất bại", error);
  }
}

async function askLLM(question) {
  const apiBase = dom.apiBase.value.trim().replace(/\/+$/, "");
  const apiKey = dom.apiKey.value.trim();
  const model = dom.model.value;

  if (!apiBase || !apiKey || !model) {
    throw new Error("Thiếu API Base, API Key hoặc model.");
  }

  const messages = [...chatHistory, { role: "user", content: question }];

  const response = await fetch(apiBase + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("API lỗi (" + response.status + "): " + errorText);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (!answer) {
    throw new Error("Không nhận được câu trả lời hợp lệ từ model.");
  }
  return answer;
}

dom.saveConfigBtn.addEventListener("click", saveConfig);

dom.clearBtn.addEventListener("click", () => {
  chatHistory = [{ role: "system", content: SYSTEM_PROMPT }];
  dom.messages.innerHTML = "";
  setStatus("Đã xóa hội thoại");
});

dom.chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = dom.prompt.value.trim();
  if (!question) return;

  addMessage("user", question);
  dom.prompt.value = "";
  dom.sendBtn.disabled = true;
  setStatus("Đang gọi model...", "loading");

  try {
    const answer = await askLLM(question);
    chatHistory.push({ role: "user", content: question });
    chatHistory.push({ role: "assistant", content: answer });
    addMessage("assistant", answer);
    setStatus("Sẵn sàng");
  } catch (error) {
    addMessage("assistant", "Loi: " + error.message);
    setStatus("Có lỗi", "error");
  } finally {
    dom.sendBtn.disabled = false;
    dom.prompt.focus();
  }
});

loadConfig();
addMessage(
  "assistant",
  "Xin chào, hãy nhập API key để được tư vấn một cách nhiệt tình nhe"
);
