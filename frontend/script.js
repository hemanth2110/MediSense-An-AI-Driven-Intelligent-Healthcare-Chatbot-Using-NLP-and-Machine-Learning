console.log("SCRIPT LOADED 🚀");

const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");

const sessionListDiv = document.getElementById("session-list");
const newSessionBtn = document.querySelector(".new-session-btn");

/* ============================================================
   SESSION MANAGEMENT
============================================================ */

let SESSION_ID = localStorage.getItem("active_session");

if (!SESSION_ID) {
    SESSION_ID = "session-" + Date.now();
    saveSessionId(SESSION_ID);
    saveSessionToList(SESSION_ID);
}

function saveSessionId(id) {
    localStorage.setItem("active_session", id);
}

function getSavedSessions() {
    return JSON.parse(localStorage.getItem("sessions") || "[]");
}

function saveSessionToList(id) {
    const sessions = getSavedSessions();
    if (!sessions.includes(id)) {
        sessions.push(id);
        localStorage.setItem("sessions", JSON.stringify(sessions));
    }
}

/* ============================================================
   RENAME SESSION
============================================================ */

function renameSession(oldId) {
    let newName = prompt("Rename session:", oldId);
    if (!newName) return;

    newName = newName.trim();
    if (newName === "") return;

    let sessions = getSavedSessions();
    let index = sessions.indexOf(oldId);

    if (index !== -1) {
        sessions[index] = newName;
        localStorage.setItem("sessions", JSON.stringify(sessions));
    }

    if (SESSION_ID === oldId) {
        SESSION_ID = newName;
        saveSessionId(newName);
    }

    loadSessionList();
    loadHistory();
}

/* ============================================================
   DELETE SESSION
============================================================ */

function deleteSession(id) {
    if (!confirm("Delete this chat permanently?")) return;

    let sessions = getSavedSessions().filter(s => s !== id);
    localStorage.setItem("sessions", JSON.stringify(sessions));

    if (SESSION_ID === id) {
        if (sessions.length > 0) {
            SESSION_ID = sessions[0];
        } else {
            SESSION_ID = "session-" + Date.now();
            sessions.push(SESSION_ID);
            localStorage.setItem("sessions", JSON.stringify(sessions));
        }
        saveSessionId(SESSION_ID);
    }

    loadSessionList();
    loadHistory();
}

/* ============================================================
   LOAD SESSION LIST
============================================================ */

function loadSessionList() {
    sessionListDiv.innerHTML = "";
    const sessions = getSavedSessions();

    sessions.forEach(id => {
        const item = document.createElement("div");
        item.className = "session-item";

        if (id === SESSION_ID) item.classList.add("active-session");

        const name = document.createElement("div");
        name.className = "session-name";
        name.innerText = id;
        name.onclick = () => switchSession(id);

        const actions = document.createElement("div");
        actions.className = "session-actions";

        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.onclick = e => {
            e.stopPropagation();
            renameSession(id);
        };

        const delBtn = document.createElement("button");
        delBtn.innerHTML = "🗑️";
        delBtn.onclick = e => {
            e.stopPropagation();
            deleteSession(id);
        };

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        item.appendChild(name);
        item.appendChild(actions);

        sessionListDiv.appendChild(item);
    });
}

function switchSession(id) {
    SESSION_ID = id;
    saveSessionId(id);
    loadSessionList();
    loadHistory();
}

/* ============================================================
   TEXT-TO-SPEECH (TOGGLE PLAY/STOP)
============================================================ */

function toggleSpeak(text, btn) {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        btn.innerHTML = "🔊";
        return;
    }

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";

    speech.onstart = () => btn.innerHTML = "⛔";
    speech.onend = () => btn.innerHTML = "🔊";

    speechSynthesis.speak(speech);
}

/* ============================================================
   MESSAGE TYPING EFFECT
============================================================ */

function typeMessage(text, role) {
    const wrapper = document.createElement("div");
    wrapper.className = role === "user" ? "user-msg" : "bot-msg";

    const msgText = document.createElement("span");
    msgText.innerText = "";

    wrapper.appendChild(msgText);
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

    let index = 0;

    function typeNext() {
        if (index < text.length) {
            msgText.innerText = text.slice(0, index + 1);
            index++;
            chatBox.scrollTop = chatBox.scrollHeight;
            setTimeout(typeNext, 15);
        } else {
            if (role === "assistant") {
                const btn = document.createElement("button");
                btn.className = "speak-btn";
                btn.innerHTML = "🔊";
                btn.onclick = () => toggleSpeak(text, btn);
                wrapper.appendChild(btn);
            }
        }
    }

    typeNext();
}

/* ============================================================
   ADD MESSAGE (HISTORY & USER)
============================================================ */

function addMessage(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className = role === "user" ? "user-msg" : "bot-msg";

    const span = document.createElement("span");
    span.innerText = text;
    wrapper.appendChild(span);

    if (role === "assistant") {
        const btn = document.createElement("button");
        btn.className = "speak-btn";
        btn.innerHTML = "🔊";
        btn.onclick = () => toggleSpeak(text, btn);
        wrapper.appendChild(btn);
    }

    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

/* ============================================================
   LOAD CHAT HISTORY
============================================================ */

async function loadHistory() {
    chatBox.innerHTML = "";

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/history/${SESSION_ID}/`);
        const data = await res.json();

        data.history.forEach(msg => addMessage(msg.role, msg.text));

    } catch (err) {
        console.error("History error:", err);
    }
}

/* ============================================================
   SEND MESSAGE
============================================================ */

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage("user", message);
    userInput.value = "";

    try {
        const res = await fetch("http://127.0.0.1:8000/api/chat/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: message, session_id: SESSION_ID }),
        });

        const data = await res.json();
        typeMessage(data.reply, "assistant");

    } catch (err) {
        typeMessage("⚠ Server error", "assistant");
    }
}

/* ============================================================
   NEW SESSION
============================================================ */

newSessionBtn.onclick = () => {
    SESSION_ID = "session-" + Date.now();
    saveSessionId(SESSION_ID);
    saveSessionToList(SESSION_ID);
    loadSessionList();
    chatBox.innerHTML = "";
};

/* ============================================================
   EVENT LISTENERS
============================================================ */

sendBtn.onclick = sendMessage;

userInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

document.addEventListener("DOMContentLoaded", () => {
    loadSessionList();
    loadHistory();
});

/* ============================================================
   SPEECH-TO-TEXT (MIC)
============================================================ */

const micBtn = document.getElementById("mic-btn");
let recognition;

if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = event => {
        userInput.value = event.results[0][0].transcript;
        sendMessage();
    };
}

micBtn.onclick = () => recognition.start();
