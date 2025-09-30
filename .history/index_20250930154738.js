// =======================
// Front ChatApp
// =======================
let CURRENT_USER = null;
let SELECTED_USER = null;
let usersInterval = null;
let messagesInterval = null;
let selectedGroup = null;


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
  userSearch.addEventListener("input", async (e) => {
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

  function showSuggestions(users) {
    suggestionsBox.innerHTML = "";
    users.forEach(user => {
      if (!selected.includes(user)) {
        const div = document.createElement("div");
        div.textContent = user;
        div.style.padding = "6px";
        div.style.cursor = "pointer";
        div.addEventListener("click", () => addUser(user));
        suggestionsBox.appendChild(div);
      }
    });

    suggestionsBox.style.display = users.length > 0 ? "block" : "none";
  }

  function closeSuggestions() {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
  }

  // Ajouter un utilisateur sélectionné
  function addUser(username) {
    if (!selected.includes(username)) {
      selected.push(username);

      // crée le tag avec un bouton de suppression
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = username;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "✕";
      removeBtn.title = "Retirer";
      removeBtn.style.marginLeft = "8px";
      removeBtn.style.border = "none";
      removeBtn.style.background = "transparent";
      removeBtn.style.color = "#fff";
      removeBtn.style.cursor = "pointer";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeUser(username, tag);
      });

      tag.appendChild(removeBtn);
      selectedUsers.appendChild(tag);
    }

    // vide l'input et ferme les suggestions
    userSearch.value = "";
    closeSuggestions();
  }

  // --- fonction pour retirer un user sélectionné
  function removeUser(username, tagEl) {
    selected = selected.filter(u => u !== username);
    if (tagEl && tagEl.parentNode) tagEl.parentNode.removeChild(tagEl);
  }

  cancelGroupBtn.addEventListener("click", () => {
    groupInput.style.display = "none"; // cacher l'input
  });

  createGroupBtn.addEventListener("click", () => {
    groupInput.style.display = "block"; // fait apparaître l'input
  });

  
  submitGroupBtn.addEventListener("click", async () => {
    const groupName = document.getElementById("groupName").value.trim();

    if (!groupName) {
      return alert("Merci de mettre un nom de groupe");
    }
    if (!CURRENT_USER) {
      return alert("Tu dois être connecté pour créer un groupe.");
    }

    // copie des membres sélectionnés et s'assure que le créateur y est
    const members = [...selected];
    if (!members.includes(CURRENT_USER)) members.push(CURRENT_USER);

    // désactive le bouton pour éviter les doublons
    submitGroupBtn.disabled = true;

    try {
      // 1) création du groupe (route existante /groups)
      const res = await fetch("http://localhost:3000/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_name: groupName, creator: CURRENT_USER })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur création groupe");

      const groupId = data.groupId || data.id; // s'adapte selon la réponse serveur
      // 2) si ton backend n'ajoute pas les membres envoyés automatiquement,
      // utilise la route add-member pour chaque membre (sauf le créateur si déjà ajouté)
      if (groupId) {
        const membersToAdd = members.filter(m => m !== CURRENT_USER);

        await Promise.all(membersToAdd.map(u =>
          fetch(`http://localhost:3000/groups/${groupId}/add-member`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u })
          })
        ));
      }

      alert("Groupe créé avec succès !");
      // reset UI
      selected = [];
      selectedUsers.innerHTML = "";
      document.getElementById("groupName").value = "";
      groupInput.style.display = "none";

      // (option) tu peux rafraîchir la liste d'utilisateurs / groupes ici
      await refreshConnectedUsers();
    } catch (err) {
      console.error("Erreur création groupe :", err);
      alert("Erreur lors de la création du groupe : " + err.message);
    } finally {
      submitGroupBtn.disabled = false;
    }
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
      let res;

      if (SELECTED_USER.isGroup) {
        // Envoi vers la route groupe
        res = await fetch(`http://localhost:3000/groups/${SELECTED_USER.username}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: CURRENT_USER,
            message
          })
        });
      } else {
        // Envoi vers la route privée
        res = await fetch('http://localhost:3000/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: CURRENT_USER,
            receiver: SELECTED_USER.username,
            message
          })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Erreur d'envoi.");
        return;
      }

      newMessageInput.value = "";

      // Recharge la bonne conversation
      if (SELECTED_USER.isGroup) {
        await refreshGroupMessages(SELECTED_USER.username);
      } else {
        await refreshMessages();
      }

      // Scroll en bas
      messagesBox.scrollTop = messagesBox.scrollHeight;

    } catch (err) {
      console.error(err);
      alert("Erreur d’envoi du message");
    }
  });

  let typingTimeout;
  newMessageInput.addEventListener('input', () => {
    if (!CURRENT_USER || !SELECTED_USER) return;

    fetch("/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: CURRENT_USER, to: SELECTED_USER })
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      fetch("/stopTyping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: CURRENT_USER, to: SELECTED_USER })
      });
    }, 2000);
  });

  let checkTypingInterval;

  function startCheckingTyping(targetUser) {
    stopCheckingTyping();
    checkTypingInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/typing/${targetUser}/${CURRENT_USER}`);
        const data = await res.json();
        typingIndicator.textContent = data.typing ? `${targetUser} est en train d'écrire...` : '';
      } catch (err) {
        console.error(err);
      }
    }, 1000); // toutes les 1 sec
  }

  function stopCheckingTyping() {
    if (checkTypingInterval) {
      clearInterval(checkTypingInterval);
      checkTypingInterval = null;
      typingIndicator.textContent = '';
    }
  }

  // --- Sélection d'un utilisateur dans la liste
  async function onClickUser(username, isGroup = false) {
    SELECTED_USER = {username, isGroup};
    chatWith.textContent = username;

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
    stopGroupMessagesPolling();

    if(isGroup){
      await refreshGroupMessages(username); // targetUser = groupe
      startGroupMessagesPolling(username); // on créera aussi un polling spécifique
    } else {
      await refreshMessages(username); // targetUser = groupe
      startMessagesPolling(username);

      // ✅ démarrer le polling typing pour cet utilisateur
      startCheckingTyping(username);

    }
  }

  backToUsersBtn.addEventListener('click', () => {
    conversationWrap.classList.add('hidden');
    SELECTED_USER = null;
    stopMessagesPolling();
    stopCheckingTyping(); // <-- important

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
      // Utilisateurs
      //---- on utilisera ça pour afficher si il sont conecter: const res = await fetch(`http://localhost:3000/connected-users/${encodeURIComponent(CURRENT_USER)}`);
      const res = await fetch(`http://localhost:3000/users/${CURRENT_USER}`);
      const users = await res.json();
      console.log(users);

      // Groupes
      const resGroups = await fetch(`http://localhost:3000/groups/${CURRENT_USER}`);
      const groups = await resGroups.json();

      // Nettoie la liste puis reconstruit
      usersUl.innerHTML = "";
      console.log("Users:", users);
      console.log("Groups:", groups);

      // Affiche les utilisateurs
      users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u.username;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => onClickUser(u.username, false));
        usersUl.appendChild(li);
      });
      // Affiche les groupes
      groups.forEach(g => {
        const li = document.createElement('li');
        li.textContent = g.group_name;
        li.style.cursor = 'pointer';
        li.style.fontWeight = 'bold';  // pour différencier d’un user
        li.addEventListener('click', () => onClickUser(g.id, true)); // le deuxième paramètre = c’est un groupe
        usersUl.appendChild(li);
      });

    } catch (err) {
      console.error("Erreur de récupération des utilisateurs connectés :", err);
    }
  }

  // --- Récupérer les messages d'un groupe
  async function refreshGroupMessages(groupId) {
    try {
      const res = await fetch(`http://localhost:3000/groups/${groupId}/messages`);
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

      messagesBox.scrollTop = messagesBox.scrollHeight;
    } catch (err) {
      console.error("Erreur de récupération des messages de groupe :", err);
    }
  }

  // --- Récupérer les messages entre CURRENT_USER et SELECTED_USER
  async function refreshMessages() {
    if (!CURRENT_USER || !SELECTED_USER) return;
    try {
      const url = `http://localhost:3000/messages/${encodeURIComponent(CURRENT_USER)}/${encodeURIComponent(SELECTED_USER.username)}`;
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

  let groupMessagesInterval = null;

  function startGroupMessagesPolling(group_id){
    stopGroupMessagesPolling();
    groupMessagesInterval = setInterval(() => refreshGroupMessages(group_id), 2000);
  }

  function stopGroupMessagesPolling() {
    if (groupMessagesInterval) {
      clearInterval(groupMessagesInterval);
      groupMessagesInterval =null;
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

  let typingTimeout;

  newMessageInput.addEventListener('input', () => {
    if (!CURRENT_USER || !SELECTED_USER) 
      {
        return;
      }

    // ✅ Prévenir le serveur que je tape
    fetch("http://localhost:3000/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: CURRENT_USER, to: SELECTED_USER.username })
    });

    // ✅ Affichage local (optionnel)
    typingIndicator.textContent = "Vous écrivez...";

    // ✅ Réinitialise le timeout
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      // prévenir serveur que j'ai arrêté
      fetch("http://localhost:3000/stopTyping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: CURRENT_USER, to: SELECTED_USER.username })
      });

      // efface l’indicateur local
      typingIndicator.textContent = "";
    }, 2000);
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