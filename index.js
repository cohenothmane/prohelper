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



  // --- Toggle menu (bulle 💬)
  chatToggle.addEventListener('click', () => {
    chatMenu.classList.toggle('hidden');
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

      // Charger la liste des connectés et démarrer le polling
      await refreshConnectedUsers();
      startUsersPolling();

      alert(data.message || "Connexion réussie");
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
  sendMessageBtn.addEventListener('click', async () => {
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
      const res = await fetch(`http://localhost:3000/connected-users/${encodeURIComponent(CURRENT_USER)}`);
      const users = await res.json();

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
  window.addEventListener('beforeunload', () => {
    if (CURRENT_USER) {
      navigator.sendBeacon(
        'http://localhost:3000/signout',
        JSON.stringify({ username: CURRENT_USER })
      );
    }
  });
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

    // Masquer sections post-connexion
    chatSection.classList.add('hidden');
    userListWrap.classList.add('hidden');
    conversationWrap.classList.add('hidden');

    // Afficher les boutons de connexion/inscription
    signInForm.classList.add('hidden');
    signUpForm.classList.add('hidden');
    signInBtn.classList.remove('hidden');
    signUpBtn.classList.remove('hidden');

    alert(data.message || "Déconnecté avec succès");
    // Après déconnexion
    signInBtn.classList.remove('hidden');
    signUpBtn.classList.remove('hidden');


  } catch (err) {
    console.error(err);
    alert("Erreur lors de la déconnexion côté client");
  }
});
