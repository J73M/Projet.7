/******************************************************
 * VARIABLES GLOBALES
 ******************************************************/
const form = document.getElementById('loginForm');
const message = document.getElementById('message');


/******************************************************
 * GESTION DU FORMULAIRE DE LOGIN
 ******************************************************/
form.addEventListener('submit', async function(event) {
  event.preventDefault();

  // Récupération des valeurs saisies
  const data = new FormData(form);
  const body = {
    email: data.get("email"),
    password: data.get("password")
  };

  // Requête API : tentative de connexion
  const response = await fetch("http://localhost:5678/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  // Erreur d’authentification
  if (response.status === 401) {
    message.textContent = "Email ou mot de passe incorrect.";
    message.style.color = "red";
    return;
  }

  // Connexion réussie
  if (result.token) {
    localStorage.setItem("token", result.token);
    window.location.href = "index.html";
  }
});
