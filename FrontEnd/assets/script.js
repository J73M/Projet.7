/******************************************************
 * VARIABLES GLOBALES
 ******************************************************/
const buttons = document.querySelectorAll('.btn');
const token = localStorage.getItem("token");

const navLinks = document.querySelectorAll("a");
const loginLink = navLinks[2];
const topBanner = document.getElementById("topBanner");
const filtersBar = document.querySelector(".filtersBar");
const modifyBtn = document.getElementById("modifyBtn");
const popup = document.getElementById('popup');
const openBtn = document.getElementById('open-popup');
const closeBtn = document.getElementById('close-popup');
const gallery = document.querySelector('.popup-gallery');

// Deuxième popup (ajout photo)
const backBtn = document.getElementById('backBtn');
const addPhotoBtn = document.querySelector('#popup .add-photo');
const addPhotoPopup = document.getElementById('addPhotoPopup');
const closeAddPhoto = document.getElementById('closeAddPhoto');
const uploadContent = document.querySelector('.upload-content');
const previewImage = document.getElementById('previewImage');
const submitBtn = document.getElementById('submitPhoto');
const photoInput = document.getElementById('photoInput');


/******************************************************
 * GESTION DES TRAVAUX
 ******************************************************/
// Récupérer toutes les réalisations
async function fetchWorks(filter = null) {
  const response = await fetch("http://localhost:5678/api/works");
  const realisations = await response.json();
  displayWorks(realisations, filter);
}

// Afficher les réalisations
function displayWorks(realisations, filter) {
  let body = document.querySelector("div.gallery");
  body.innerHTML = "";

  for (let i = 0; i < realisations.length; i++) {
    if (!filter || realisations[i].categoryId === filter) {
      let galleryDiv = document.createElement("div");
      let newImg = document.createElement("img");
      let newText = document.createElement("p");

      newImg.src = realisations[i].imageUrl;
      newImg.alt = realisations[i].title;
      newText.textContent = realisations[i].title;

      galleryDiv.appendChild(newImg);
      galleryDiv.appendChild(newText);
      body.appendChild(galleryDiv);
    }
  }
}


/******************************************************
 * GESTION DES CATEGORIES (FILTRES)
 ******************************************************/
// Récupérer les catégories
async function fetchCategories() {
  const response = await fetch("http://localhost:5678/api/categories");
  const categories = await response.json();
  displayFilters(categories);
}

// Afficher les boutons filtres
function displayFilters(categories) {
  let filtersContainer = document.querySelector(".filtersBar");

  // Bouton "Tous"
  let allButton = document.createElement("button");
  allButton.classList.add("btn", "active");
  allButton.innerText = "Tous";
  allButton.addEventListener("click", () => {
    setActiveFilter(allButton);
    fetchWorks();
  });
  filtersContainer.appendChild(allButton);

  // Boutons par catégorie
  categories.forEach(category => {
    let filterElement = document.createElement("button");
    filterElement.classList.add("btn");
    filterElement.innerText = category.name;

    filterElement.addEventListener("click", () => {
      setActiveFilter(filterElement);
      fetchWorks(category.id);
    });

    filtersContainer.appendChild(filterElement);
  });
}

// Activer le filtre sélectionné
function setActiveFilter(activeBtn) {
  let allBtns = document.querySelectorAll(".filtersBar .btn");
  allBtns.forEach(btn => btn.classList.remove("active"));
  activeBtn.classList.add("active");
}


/******************************************************
 * GESTION AUTHENTIFICATION
 ******************************************************/
if (token) {
  loginLink.textContent = "logout";
  loginLink.href = "#";
  loginLink.addEventListener("click", function(e) {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.reload();
  });
}

if (token) {
  topBanner.style.display = "flex";
  filtersBar.style.display = "none";
} else {
  topBanner.style.display = "none"; 
  filtersBar.style.display = "flex"; 
  modifyBtn.style.display = "none";
}


/******************************************************
 * POPUP 1 : GALERIE
 ******************************************************/
openBtn.addEventListener('click', e => {
  e.preventDefault();
  popup.style.display = 'flex';
});

closeBtn.addEventListener('click', () => popup.style.display = 'none');

popup.addEventListener('click', e => {
  if (e.target === popup) popup.style.display = 'none';
});

// Charger la popup avec les travaux
async function openPopup() {
  const res = await fetch("http://localhost:5678/api/works");
  const works = await res.json();

  gallery.innerHTML = "";

  works.forEach(work => {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";
    container.style.margin = "10px";

    const img = document.createElement("img");
    img.src = work.imageUrl;

    const trash = document.createElement("div");
    trash.className = "trash-icon";
    const trashIcon = document.createElement("i");
    trashIcon.className = "fa-solid fa-trash-can";
    trash.appendChild(trashIcon);

    trash.addEventListener("click", async () => {
      const response = await fetch(`http://localhost:5678/api/works/${work.id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        container.remove();
        fetchWorks();
      } else {
        alert(`Impossible de supprimer la photo. Status : ${response.status}`);
      }
    });

    container.appendChild(img);
    container.appendChild(trash);
    gallery.appendChild(container);
  });

  popup.style.display = 'flex';
}

openBtn.addEventListener('click', openPopup);


/******************************************************
 * POPUP 2 : AJOUT PHOTO
 ******************************************************/
backBtn.addEventListener('click', () => {
  addPhotoPopup.style.display = 'none';
  popup.style.display = 'flex';
});

addPhotoBtn.addEventListener('click', () => {
  popup.style.display = 'none';
  addPhotoPopup.style.display = 'flex';
});

closeAddPhoto.addEventListener('click', () => resetAddPhotoPopup());

window.addEventListener('click', (e) => {
  if (e.target === addPhotoPopup) resetAddPhotoPopup();
});

// Gestion de l'upload et preview image
photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];

  if (file) {
    uploadContent.style.display = 'none';
    const reader = new FileReader();
    reader.onload = e => {
      previewImage.src = e.target.result;
      previewImage.style.display = 'block';
      submitBtn.classList.add('active');
    };
    reader.readAsDataURL(file);
  } else {
    resetPreview();
  }
});

// Soumission du formulaire ajout photo
async function submitPhoto() {
  const titleInput = document.getElementById('titleInput');
  const choiceCategory = document.getElementById('choiceCategory');

  if (!photoInput.files[0]) return alert("Veuillez sélectionner une photo !");
  if (!titleInput.value.trim()) return alert("Veuillez saisir un titre !");
  if (!choiceCategory.value) return alert("Veuillez sélectionner une catégorie !");
  if (!token) return alert("Vous devez être connecté pour ajouter une photo !");

  const formData = new FormData();
  formData.append("image", photoInput.files[0]);
  formData.append("title", titleInput.value);
  formData.append("category", parseInt(choiceCategory.value)); 

  const response = await fetch("http://localhost:5678/api/works", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    addPhotoToGallery(result);
    resetAddPhotoPopup();
  } else {
    const errorData = await response.json();
    alert(`Impossible d'ajouter la photo. Status : ${response.status} - ${JSON.stringify(errorData)}`);
  }
}

document.getElementById('submitPhoto').addEventListener('click', submitPhoto);


/******************************************************
 * OUTILS (reset, preview, ajout photo)
 ******************************************************/
function resetAddPhotoPopup() {
  addPhotoPopup.style.display = 'none';
  photoInput.value = "";
  document.getElementById('titleInput').value = "";
  document.getElementById('choiceCategory').value = "";
  uploadContent.style.display = 'flex';
  previewImage.style.display = 'none';
  previewImage.src = '';
  submitBtn.classList.remove('active');
}

function resetPreview() {
  uploadContent.style.display = 'flex';
  previewImage.style.display = 'none';
  previewImage.src = '';
  submitBtn.classList.remove('active');
}

function addPhotoToGallery(result) {
  const galleryPage = document.querySelector(".gallery");
  const galleryModal = document.querySelector(".popup-gallery");

  // Page principale
  const galleryDiv = document.createElement("div");
  const newImg = document.createElement("img");
  const newText = document.createElement("p");
  newImg.src = result.imageUrl;
  newText.textContent = result.title;
  galleryDiv.appendChild(newImg);
  galleryDiv.appendChild(newText);
  galleryPage.appendChild(galleryDiv);

  // Popup
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.display = "inline-block";
  container.style.margin = "10px";
  const modalImg = document.createElement("img");
  modalImg.src = result.imageUrl;

  const trash = document.createElement("i");
  trash.className = "fa-solid fa-trash-can trash-icon";
  trash.addEventListener("click", async () => {
    await fetch(`http://localhost:5678/api/works/${result.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    container.remove();
  });

  container.appendChild(modalImg);
  container.appendChild(trash);
  galleryModal.appendChild(container);
}


/******************************************************
 * CHARGEMENT INITIAL
 ******************************************************/
async function loadCategories() {
  const select = document.getElementById('choiceCategory');
  const response = await fetch("http://localhost:5678/api/categories");
  const categories = await response.json();

  select.innerHTML = '<option value=""></option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchWorks();
  fetchCategories();
  loadCategories();
});
