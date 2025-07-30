document.addEventListener('DOMContentLoaded', () => {
  const chatToggle = document.querySelector('.chatToggle');
  const chatMenu = document.querySelector('.chatMenu');

  const signInBtn = document.getElementById('signInBtn');
  const signUpBtn = document.getElementById('signUpBtn');

  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');

  const submitSignIn = document.getElementById('submitSignIn');
  const submitSignUp = document.getElementById('submitSignUp');

  chatToggle.addEventListener('click', () => {
    chatMenu.classList.toggle('hidden');
  });

  signInBtn.addEventListener('click', () => {
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
  });

  signUpBtn.addEventListener('click', () => {
    signUpForm.classList.remove('hidden');
    signInForm.classList.add('hidden');
  });

  submitSignIn.addEventListener('click', async () => {
    const username = document.getElementById('signInId').value.trim();
    const password = document.getElementById('signInPassword').value;
    if (!username || !password) return alert("Veuillez remplir tous les champs.");

    try {
      const res = await fetch('http://localhost:3000/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        document.getElementById('userList').classList.remove('hidden');
        fetchUsers(username);
      }
    } catch (err) {
      alert("Erreur de connexion au serveur.");
      console.error(err);
    }
  });

  submitSignUp.addEventListener('click', async () => {
    const username = document.getElementById('signUpId').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirm = document.getElementById('signUpConfirmPassword').value;

    if (!username || !password || !confirm) return alert("Veuillez remplir tous les champs.");
    if (password !== confirm) return alert("Les mots de passe ne correspondent pas.");

    try {
      const res = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("Erreur de connexion au serveur.");
      console.error(err);
    }
  });
});

async function fetchUsers(currentUsername) {
  try {
    const res = await fetch(`http://localhost:3000/users?username=${encodeURIComponent(currentUsername)}`);
    const data = await res.json();
    const usersUl = document.getElementById('usersUl');
    usersUl.innerHTML = '';
    data.users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user.username;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        const message = prompt(`Envoyer un message à ${user.username} :`);
        if (message) sendMessage(currentUsername, user.username, message);
      });
      usersUl.appendChild(li);
    });
  } catch (err) {
    console.error("Erreur de récupération des utilisateurs :", err);
  }
}

async function sendMessage(from, to, message) {
  try {
    const res = await fetch('http://localhost:3000/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, message }),
    });
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    alert("Erreur d’envoi du message");
    console.error(err);
  }
}

function afficherUtilisateurs(users, currentUser) {
  const container = document.createElement("div");
  container.id = "listeUtilisateurs";

  const titre = document.createElement("h3");
  titre.textContent = "Utilisateurs connectés";
  container.appendChild(titre);

  users.forEach(user => {
    if (user.username !== currentUser) { // évite de s'envoyer un message à soi-même
      const bouton = document.createElement("button");
      bouton.textContent = user.username;
      bouton.addEventListener("click", () => {
        afficherZoneDeMessage(currentUser, user.username);
      });
      container.appendChild(bouton);
    }
  });

  document.body.appendChild(container);
}

function afficherZoneDeMessage(from, to) {
  // Supprime l'ancienne zone s'il y en avait une
  const ancienne = document.getElementById("zoneMessage");
  if (ancienne) ancienne.remove();

  const zone = document.createElement("div");
  zone.id = "zoneMessage";

  const titre = document.createElement("h4");
  titre.textContent = `Envoyer un message à ${to}`;
  zone.appendChild(titre);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Votre message";
  zone.appendChild(input);

  const bouton = document.createElement("button");
  bouton.textContent = "Envoyer";
  bouton.addEventListener("click", async () => {
    const message = input.value.trim();
    if (!message) return;

    const res = await fetch('http://localhost:3000/send', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, message })
    });

    const data = await res.json();
    alert(data.message);
    input.value = "";
  });

  zone.appendChild(bouton);
  document.body.appendChild(zone);
}
