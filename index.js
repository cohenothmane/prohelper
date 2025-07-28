const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

// Fonction pour ajouter un message au chat
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight; // scroll en bas automatiquement
}

// Réponse simple automatique
function getBotResponse(userText) {
  const lower = userText.toLowerCase();

  if (lower.includes("bonjour") || lower.includes("salut")) {
    return "Salut ! Comment puis-je t'aider ?";

  } else if (lower.includes("aide") || lower.includes("problème")) {
    return "D'accord, quel est ton problème exactement ?";

  } else if (lower.includes("merci")) {
    return "Avec plaisir 😊";
    
  } else {
    return "Je vais transmettre ça à un agent, attends un instant...";
  }
}

// Envoi du message utilisateur
function handleSend() {
  const text = input.value.trim();
  if (text === "") return;

  addMessage("user", text);

  const response = getBotResponse(text);

  setTimeout(() => {
    addMessage("bot", response);
  }, 400);

  input.value = "";
}

// Clic sur le bouton "Envoyer"
sendBtn.addEventListener("click", handleSend);

// Appuie sur Entrée pour envoyer
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSend();
  }
});
