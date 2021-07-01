const loggedOutLinks = document.querySelectorAll(".logged-out");
const loggedInLinks = document.querySelectorAll(".logged-in");

const loginCheck = (user) => {
  if (user) {
    loggedInLinks.forEach((link) => (link.style.display = "block"));
    loggedOutLinks.forEach((link) => (link.style.display = "none"));
  } else {
    loggedInLinks.forEach((link) => (link.style.display = "none"));
    loggedOutLinks.forEach((link) => (link.style.display = "block"));
  }
};

// SignUp
const signUpForm = document.querySelector("#signup-form");
signUpForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signUpForm["signup-email"].value;
  const password = signUpForm["signup-password"].value;

  // Authenticate the User
  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // clear the form
      signUpForm.reset();
      // close the modal
      $("#signupModal").modal("hide");
    });
});

// Logout
const logout = document.querySelector("#logout");

logout.addEventListener("click", (e) => {
  e.preventDefault();
  auth.signOut().then(() => {
    console.log("signup out");
  });
});

// SingIn
const signInForm = document.querySelector("#login-form");

signInForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signInForm["login-email"].value;
  const password = signInForm["login-password"].value;

  // Authenticate the User
  auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
    // clear the form

    signInForm.reset();
    // close the modal
    $("#signinModal").modal("hide");
  });
});


const productos = document.querySelector(".productos");
const visualizarproductos = (data) => {
  if (data.length) {
    let html = "";
    data.forEach((doc) => {
      const post = doc.data();
      const li = `
      <li class="list-group-item list-group-item-action">
        <h5>${post.titulo}</h5>
        <p>$${post.precio}</p>
        <img style="width:100%;" src="images/productos/${post.imagen}" alt="no se encontro imagen">
        <p>${post.descripcion}</p>
        <p>${post.detalles}</p>
      </li>
    `;
      html += li;
    });
    productos.innerHTML = html;
  } else {
    productos.innerHTML = '<h4 class="text-dark">Por favor Inicie seción  para poder ver los productos al por mayor</h4>';
  }
};

// events
// list for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("signin");
    fs.collection("productos")
    .get()
    .then((snapshot) => {
      visualizarproductos(snapshot.docs);
      loginCheck(user);
    });
      
  } else {
    console.log("signout");
    visualizarproductos([]);
    
    loginCheck(user);
  }
});

// Login with Google
const googleButton = document.querySelector("#googleLogin");

googleButton.addEventListener("click", (e) => {
  e.preventDefault();
  signInForm.reset();
  $("#signinModal").modal("hide");

  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then((result) => {
    console.log(result);
    console.log("google sign in");
  })
  .catch(err => {
    console.log(err);
  })
});

// Login with Facebook
const facebookButton = document.querySelector('#facebookLogin');

facebookButton.addEventListener('click', e => {
  e.preventDefault();
  signInForm.reset();
  $("#signinModal").modal("hide");

  const provider = new firebase.auth.FacebookAuthProvider();
  auth.signInWithPopup(provider).then((result) => {
    console.log(result);
    console.log("facebook sign in");
  })
  .catch(err => {
    console.log(err);
  })

})

const db = firebase.firestore();

const productoForm = document.getElementById("producto-form");
const productosContainer = document.getElementById("productos-container");

let editStatus = false;
let id = '';

/**
 * Save a New producto in Firestore
 * @param {string} titulo the titulo of the producto
 * @param {string} precio the precio of the producto
 */
const saveproducto = (titulo, precio) =>
  db.collection("productos").doc().set({
    titulo,
    precio,
  });

const getproductos = () => db.collection("productos").get();

const onGetproductos = (callback) => db.collection("productos").onSnapshot(callback);

const deleteproducto = (id) => db.collection("productos").doc(id).delete();

const getproducto = (id) => db.collection("productos").doc(id).get();

const updateproducto = (id, updatedproducto) => db.collection('productos').doc(id).update(updatedproducto);

window.addEventListener("DOMContentLoaded", async (e) => {
  onGetproductos((querySnapshot) => {
    productosContainer.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const producto = doc.data();

      productosContainer.innerHTML += `<div class="card card-body mt-2 border-primary">
    <h3 class="h5">${producto.titulo}</h3>
    <p>${producto.precio}</p>
    <div>
      <button class="btn btn-danger btn-delete"  data-id="${doc.id}">
        🗑 Eliminar
      </button>
      <button class="btn btn-secondary btn-edit" style="background-color: #ff9d13;"  data-id="${doc.id}">
        🖉 Editar
      </button>
    </div>
  </div>`;
    });

    const btnsDelete = productosContainer.querySelectorAll(".btn-delete");
    btnsDelete.forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        console.log(e.target.dataset.id);
        try {
          await deleteproducto(e.target.dataset.id);
        } catch (error) {
          console.log(error);
        }
      })
    );

    const btnsEdit = productosContainer.querySelectorAll(".btn-edit");
    btnsEdit.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        try {
          const doc = await getproducto(e.target.dataset.id);
          const producto = doc.data();
          productoForm["producto-titulo"].value = producto.titulo;
          productoForm["producto-precio"].value = producto.precio;

          editStatus = true;
          id = doc.id;
          productoForm["h4-producto-form"].innerText = "Editar";
          productoForm["btn-producto-form"].innerText = "Editar";

        } catch (error) {
          console.log(error);
        }
      });
    });
  });
});

productoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const titulo = productoForm["producto-titulo"];
  const precio = productoForm["producto-precio"];

  try {
    if (!editStatus) {
      await saveproducto(titulo.value, precio.value);
    } else {
      await updateproducto(id, {
        titulo: titulo.value,
        precio: precio.value,
      })

      editStatus = false;
      id = '';
      productoForm['btn-producto-form'].innerText = 'Save';
    }

    productoForm.reset();
    titulo.focus();
  } catch (error) {
    console.log(error);
  }
});
