// =======================
// Front ChatApp
// =======================
let CURRENT_USER = null;
let SELECTED_USER = null;
let usersInterval = null;
let messagesInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  // --- Éléments UI
  const chatToggle = document.querySelector('.chatToggle');
  const chatMenu = document.querySelector('.chatMenu');

  const signInBtn = document.getElementById('signInBtn');
  const signUpBtn = document.getElementById('signUpBtn');

  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');

  const submitSignIn = document.getElementById('submitSignIn');
  const submitSignUp = document.getElementById('submitSignUp');

  const userListWrap = document.getElementById('userList');   // bloc "Utilisateurs connectés"
  const usersUl = document.getElementById('usersUl');

  const chatSection = document.getElementById('chatSection'); // bloc "Connecté en tant que ..."
  const currentUserDisplay = document.getElementById('currentUserDisplay');

  const conversationWrap = document.getElementById('conversation');
  const chatWith = document.getElementById('chatWith');
  const messagesBox = document.getElementById('messages');
  const newMessageInput = document.getElementById('newMessage');
  const sendMessageBtn = document.getElementById('sendMessage');
  const backToUsersBtn = document.getElementById('backToUsers');
  const signOutBtn = document.getElementById('signOutBtn');

  const emojiBtn = document.getElementById('emojiBtn');

  const createGroupBtn = document.getElementById("createGroupBtn");
  const groupInput = document.getElementById("groupInput");
  const submitGroupBtn = document.getElementById("submitGroupBtn");
  const cancelGroupBtn = document.getElementById("cancelGroupBtn");

  const userSearch = document.getElementById("userSearch");
  const suggestionsBox = document.getElementById("suggestions");
  const selectedUsers = document.getElementById("selectedUsers");
  const groupMembersInput = document.getElementById("groupMembers");

  let selected = [];

  hideCreateGroupButton(); // on cache le bouton de groupe

  function showCreateGroupButton() {
    createGroupBtn.style.display = "inline-block";
  }

  function hideCreateGroupButton() {
    createGroupBtn.style.display = "none";
    groupInput.style.display = "none"; // cache aussi l'input si ouvert
  }

  // Quand on tape dans l'input pour choisire les membre du groupe
  userSearch.addEventListener("input", async () => {
    const query = userSearch.value.trim();
    if (query.length === 0) {
      suggestionsBox.style.display = "none";
      return;
    }

  groupMembersInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    if (!query) {
      closeSuggestions(); // fonction pour vider la liste
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/searchUser?query=${encodeURIComponent(query)}`);
      const users = await res.json();
      showSuggestions(users); // fonction pour afficher les suggestions
    } catch (err) {
      console.error("Erreur recherche users :", err);
    }
  });
  
    // 👉 Appel au backend pour chercher les utilisateurs
    const res = await fetch(`/searchUser?query=${encodeURIComponent(query)}`);
    const users = await res.json();

    // Affichage des résultats
    suggestionsBox.innerHTML = "";
    users.forEach(user => {
      if (!selected.includes(user)) { // éviter doublons
        const div = document.createElement("div");
        div.textContent = user;
        div.addEventListener("click", () => addUser(user));
        suggestionsBox.appendChild(div);
      }
    });

    suggestionsBox.style.display = users.length > 0 ? "block" : "none";
  });

  // Ajouter un utilisateur sélectionné
  function addUser(username) {
    if (!selected.includes(username)) {
      selected.push(username);

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = username;

      selectedUsers.appendChild(tag);
    }

    userSearch.value = "";
    suggestionsBox.style.display = "none";
  }

  cancelGroupBtn.addEventListener("click", () => {
    groupInput.style.display = "none"; // cacher l'input
  });

  createGroupBtn.addEventListener("click", () => {
    groupInput.style.display = "block"; // fait apparaître l'input
  });

  submitGroupBtn.addEventListener("click", () => {
    const groupName = document.getElementById("groupName").value;
    const creator = CURRENT_USER; // ou la variable qui stocke ton utilisateur connecté

    if (!groupName) return alert("Merci de mettre un nom de groupe");

    fetch("http://localhost:3000/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_name: groupName, creator })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        groupInput.style.display = "none"; // cache l'input après création
        document.getElementById("groupName").value = ""; // reset input
      })
      .catch(err => console.error(err));
  });

  const emojiPicker = document.getElementById('emojiPicker');
  chatToggle.addEventListener('click', () => {
    console.log("💬 ChatToggle cliqué");
    chatMenu.classList.toggle('hidden');
    });


  // Quand on clique sur un emoji
  emojiPicker.addEventListener('emoji-click', (event) => {
    const emoji = event.detail.unicode;
    const start = newMessageInput.selectionStart;
    const end = newMessageInput.selectionEnd;
    const text = newMessageInput.value;

    newMessageInput.value = text.slice(0, start) + emoji + text.slice(end);

    // remettre le curseur après l’emoji
    newMessageInput.selectionStart = newMessageInput.selectionEnd = start + emoji.length;
    newMessageInput.focus();
  });



  backToUsersBtn.addEventListener('click', () => {
    console.log('Retour cliqué'); // pour debug : ouvre la console (F12) pour voir ce message
    // cacher la conversation
    conversationWrap.classList.add('hidden');
    // reset sélection et messages
    SELECTED_USER = null;
    chatWith.textContent = '';
    messagesBox.innerHTML = '';

    const usersUl = document.getElementById("usersUl");

    // Après avoir mis à jour la liste
    usersUl.scrollTop = usersUl.scrollHeight;


    // arrêter le polling des messages
    stopMessagesPolling();

    // réafficher la liste des utilisateurs
    userListWrap.classList.remove('hidden');


    // (option) reprendre le polling des users si tu l'avais stoppé
    startUsersPolling();
  });

  // --- Navigation SignIn/SignUp
  signInBtn.addEventListener('click', () => {
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
  });

  signUpBtn.addEventListener('click', () => {
    signUpForm.classList.remove('hidden');
    signInForm.classList.add('hidden');
  });

  // --- Connexion
  submitSignIn.addEventListener('click', async () => {
    const username = document.getElementById('signInId').value.trim();
    const password = document.getElementById('signInPassword').value;

    if (!username || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Connexion échouée");
        return;
      }

      // Succès
      CURRENT_USER = username;
      currentUserDisplay.textContent = CURRENT_USER;

      // UI : afficher sections post-connexion
      userListWrap.classList.remove('hidden');
      chatSection.classList.remove('hidden');
      showCreateGroupButton(); // bouton visible seulement sur la liste d'utilisateurs

      // Charger la liste des connectés et démarrer le polling
      await refreshConnectedUsers();
      startUsersPolling();
       
      signInBtn.classList.add('hidden');
      signUpBtn.classList.add('hidden');
      signInForm.classList.add('hidden');
      signUpForm.classList.add('hidden');      

    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur.");
    }
  });

  // --- Inscription
  submitSignUp.addEventListener('click', async () => {
    const username = document.getElementById('signUpId').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirm  = document.getElementById('signUpConfirmPassword').value;

    if (!username || !password || !confirm) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    if (password !== confirm) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Inscription échouée");
        return;
      }

      alert(data.message || "Compte créé avec succès");
      // Option : basculer vers l'onglet connexion
      signInForm.classList.remove('hidden');
      signUpForm.classList.add('hidden');
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur.");
    }
  });

  // --- Envoi d'un message
  sendMessageBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!CURRENT_USER || !SELECTED_USER) return;
    const message = newMessageInput.value.trim();
    if (!message) return;

    try {
      const res = await fetch('http://localhost:3000/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: CURRENT_USER,
          receiver: SELECTED_USER,
          message
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Erreur d'envoi.");
        return;
      }
      newMessageInput.value = "";
      // recharge la conversation
      console.log("Test click"); 
      await refreshMessages();
      // scroll en bas
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } catch (err) {
      console.error(err);
      alert("Erreur d’envoi du message");
    }
  });

  // --- Sélection d'un utilisateur dans la liste
  async function onClickUser(username) {
    SELECTED_USER = username;
    chatWith.textContent = SELECTED_USER;

    // afficher la conversation
    conversationWrap.classList.remove('hidden');

    // cacher la liste d'utilisateurs
    userListWrap.classList.add('hidden');

    // cache le bouton de groupe dans la conversation
    hideCreateGroupButton();

    // cacher le bouton Déconnexion seulement dans la conversation
    signOutBtn.style.display = 'none';

    // masquer les formulaires de connexion/inscription
    signInForm.classList.add('hidden');
    signUpForm.classList.add('hidden');

    // stop ancien polling messages et lancer le nouveau
    stopMessagesPolling();
    await refreshMessages();
    startMessagesPolling();
  }

  backToUsersBtn.addEventListener('click', () => {
    conversationWrap.classList.add('hidden');
    SELECTED_USER = null;
    stopMessagesPolling();

    userListWrap.classList.remove('hidden');

    // on revient sur la liste → bouton de groupe visible
    showCreateGroupButton();

    // remettre le bouton Déconnexion visible
    signOutBtn.style.display = 'inline-block';
  });

  // Quand on revient à la liste des utilisateurs
  backToUsersBtn.addEventListener('click', () => {
    conversationWrap.classList.add('hidden');  // cacher la conversation
    SELECTED_USER = null;                      // reset user sélectionné
    stopMessagesPolling();                     // arrêter le polling des messages

    // réafficher la liste des utilisateurs et le bouton Déconnexion
    userListWrap.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');
  });
  // --- Récupérer la liste des utilisateurs connectés (sauf moi)
  async function refreshConnectedUsers() {
    if (!CURRENT_USER) return;
    try {
      //---- on utilisera ça pour afficher si il sont conecter: const res = await fetch(`http://localhost:3000/connected-users/${encodeURIComponent(CURRENT_USER)}`);
      const res = await fetch(`http://localhost:3000/users/${CURRENT_USER}`);
      const users = await res.json();
      console.log(users);

      // Nettoie la liste puis reconstruit
      usersUl.innerHTML = "";
      users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u.username;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => onClickUser(u.username));
        usersUl.appendChild(li);
      });
    } catch (err) {
      console.error("Erreur de récupération des utilisateurs connectés :", err);
    }
  }

  // --- Récupérer les messages entre CURRENT_USER et SELECTED_USER
  async function refreshMessages() {
    if (!CURRENT_USER || !SELECTED_USER) return;
    try {
      const url = `http://localhost:3000/messages/${encodeURIComponent(CURRENT_USER)}/${encodeURIComponent(SELECTED_USER)}`;
      const res = await fetch(url);
      const msgs = await res.json();

      messagesBox.innerHTML = "";
      msgs.forEach(m => {
        const line = document.createElement('div');
        const mine = m.sender === CURRENT_USER;
        line.style.padding = '6px 8px';
        line.style.margin = '4px 0';
        line.style.borderRadius = '10px';
        line.style.maxWidth = '80%';
        line.style.alignSelf = mine ? 'flex-end' : 'flex-start';
        line.style.background = mine ? '#dff3d9' : '#eaeaea';
        line.textContent = `${m.sender}: ${m.message}`;
        messagesBox.appendChild(line);
      });

      // auto-scroll en bas
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } catch (err) {
      console.error("Erreur de récupération des messages :", err);
    }
  }

  // --- Polling helpers
  function startUsersPolling() {
    stopUsersPolling();
    usersInterval = setInterval(refreshConnectedUsers, 3000);
  }
  function stopUsersPolling() {
    if (usersInterval) {
      clearInterval(usersInterval);
      usersInterval = null;
    }
  }
  function startMessagesPolling() {
    stopMessagesPolling();
    messagesInterval = setInterval(refreshMessages, 2000);
  }
  function stopMessagesPolling() {
    if (messagesInterval) {
      clearInterval(messagesInterval);
      messagesInterval = null;
    }
  }

  // (Option) Déconnexion propre quand l’onglet se ferme
  // Déconnexion automatique sans popup
  window.addEventListener('unload', () => {
    if (CURRENT_USER) {
      navigator.sendBeacon(
        'http://localhost:3000/signout',
        JSON.stringify({ username: CURRENT_USER })
      );
    }
  });

  const typingIndicator = document.getElementById('typingIndicator');
  let typingTimeout = null;

  // Quand l'utilisateur local tape : afficher un indicateur local (version front-only)
  newMessageInput.addEventListener('input', () => {
    // Affiche localement (ex: "Tu écris..." ou vide pour ne rien afficher côté local)
    typingIndicator.textContent = "Vous écrivez...";

    // Réinitialise le timeout : si plus d'activité après 1500ms, efface l'indicateur
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      typingIndicator.textContent = "";
    }, 1500);
  });

  signOutBtn.addEventListener('click', async () => {
    if (!CURRENT_USER) return;

    try {
      const res = await fetch('http://localhost:3000/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: CURRENT_USER })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Erreur lors de la déconnexion");
        return;
      }

      // Réinitialiser l'état
      CURRENT_USER = null;
      SELECTED_USER = null;

      // Vider les champs de connexion
      document.getElementById('signInId').value = "";
      document.getElementById('signInPassword').value = "";


      // Masquer sections post-connexion
      chatSection.classList.add('hidden');
      userListWrap.classList.add('hidden');
      conversationWrap.classList.add('hidden');

      // Afficher les boutons de connexion/inscription
      signInForm.classList.add('hidden');
      signUpForm.classList.add('hidden');
      signInBtn.classList.remove('hidden');
      signUpBtn.classList.remove('hidden');

      // Après déconnexion
      signInBtn.classList.remove('hidden');
      signUpBtn.classList.remove('hidden');


    } catch (err) {
      console.error(err);
      alert("Erreur lors de la déconnexion côté client");
    }
  });

  // Toggle ouverture du picker
  emojiBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
  });

  // Quand on clique un emoji, il s’ajoute dans l’input
  emojiPicker.addEventListener('emoji-click', event => {
    newMessageInput.value += event.detail.unicode;
    newMessageInput.focus();
  });
});