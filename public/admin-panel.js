document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "/adminlogin.html"; 
  });
  document
  .getElementById("closeModal")
  .addEventListener("click", closeModal);

  
  // =======================================
// STATE
// =======================================

let products = [];

let editingProduct = null;

let selectedFile = null;

let isSaving = false;



document.getElementById("title").value
document.getElementById("price").value
document.getElementById("category").value
const saveBtn =
document.querySelector(".save-btn");
// =======================================
// DOM
// =======================================

const productsContainer =
document.getElementById(
  "productsContainer"
);

const modal =
document.getElementById(
  "productModal"
);

const form =
document.getElementById(
  "productForm"
);



function updateProducts(newProducts) {
  products = newProducts;
  renderProducts();
}

// =======================================
// FORMAT UGX
// =======================================

function formatUGX(amount){

  return new Intl.NumberFormat(
    "en-UG",
    {
      style:"currency",
      currency:"UGX",
      minimumFractionDigits:0
    }
  ).format(amount);

}


modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});




// =======================================
// OPEN ADD
// =======================================

document
.getElementById("addBtn")
.addEventListener("click",()=>{

  editingProduct = null;

  form.reset();

openModal();

});


// =======================================
// CLOSE
// =======================================






// safer backdrop detection
modal.addEventListener("click", (e) => {
  const clickedOutside =
    e.target === modal;

  if (clickedOutside) {
    closeModal();
  }
});

function openModal() {
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

// =======================================
// FILE PREVIEW
// =======================================

document
.getElementById("mediaFile")
.addEventListener("change",(e)=>{

  selectedFile =
  e.target.files[0];

  if(!selectedFile) return;

  const url =
  URL.createObjectURL(
    selectedFile
  );

  const preview =
  document.getElementById(
    "previewContainer"
  );

  if(
    selectedFile.type.startsWith(
      "video/"
    )
  ){

    preview.innerHTML = `
      <video
        src="${url}"
        controls
      ></video>
    `;

  }else{

    preview.innerHTML = `
      <img
        src="${url}"
      >
    `;

  }

});


// =======================================
// SAVE
// =======================================
form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    try {

      if(editingProduct){

        await updateProduct({
          id: editingProduct.id,
          title: title.value,
          price: Number(price.value),
          description: description.value,
          category: category.value,
          stock: Number(stock.value),
          lowStockThreshold:
            Number(
              lowStockThreshold.value
            )
        });

        await loadProducts();
closeModal();

        showToast(
          "Product updated"
        );

      } else {

        await addProduct();

      }

    } catch(err){

      console.error(err);

      showToast(
        err.message,
        "error"
      );

    }

  }
);

// =======================================
// RENDER PRODUCTS
// =======================================

function renderProducts(){

  productsContainer.innerHTML =
  products.map(product=>`

    <div class="product-card">

      <img
        src="${product.image || ''}"
      >

      <div class="product-info">

        <div class="product-title">
          ${product.title}
        </div>

        <div class="product-price">
          ${formatUGX(product.price)}
        </div>

      </div>
<span class="
  ${
    isLowStock(product)
      ? "danger"
      : "success"
  }
">
  Stock:
  ${product.stock}
</span>
      <div class="actions">

        <button
          class="edit-btn"
onclick="editProduct('${product._id || product.id}')"        >
          <i class="fa-solid fa-pen"></i>
        </button>

        <button
          class="delete-btn"
          onclick="deleteProduct('${product.id}')"
        >
          <i class="fa-solid fa-trash"></i>
        </button>

      </div>

    </div>

  `).join("");

}




// =======================================
// DELETE
// =======================================




// =======================================
// EDIT
// =======================================
window.editProduct = function(id){

  const product =
    products.find(p =>
      p.id === id || p._id === id
    );

  if(!product){
    console.warn("Product not found:", id);
    return;
  }

  editingProduct = product;

  document.getElementById("title").value =
    product.title || "";

  document.getElementById("price").value =
    product.price || "";

  document.getElementById("description").value =
    product.description || "";

  document.getElementById("category").value =
    product.category || "";

  document.getElementById("stock").value =
    product.stock || 0;

  document.getElementById("lowStockThreshold").value =
    product.lowStockThreshold || 5;

  // show modal
openModal();
  console.log("✏️ Editing product:", product);
};



async function compressImage(file, quality = 0.6) {

  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = (event) => {

      const img = new Image();

      img.src = event.target.result;

      img.onload = () => {

        const canvas = document.createElement("canvas");

        const MAX_WIDTH = 1200;

        const scale = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {

            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: "image/jpeg",
                lastModified: Date.now()
              }
            );

            resolve(compressedFile);

          },
          "image/jpeg",
          quality
        );
      };
    };
  });
}



// uploader.js

async function uploadToCloudinary(file, fields = {}) {

  const fd = new FormData();

  fd.append("file", file);

  Object.entries(fields).forEach(
    ([key, value]) => {
      fd.append(key, value);
    }
  );

  const response =
    await fetch(
      "/api/upload/",
      {
        method: "POST",
        body: fd
      }
    );

  const data =
    await response.json();

  if (!data.success) {
    throw new Error(
      data.message ||
      "Upload failed"
    );
  }

  return data.product;
}

function showToast(
  message,
  type = "success"
) {

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${type}`;

  toast.textContent =
    message;

  document.body.appendChild(
    toast
  );

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

async function updateProduct(
  product
){

  await fetch(
    `/api/products/${product.id}`,
    {
      method:"PUT",

      headers:{
        "Content-Type":
        "application/json"
      },

      body:JSON.stringify(
        product
      )
    }
  );

}



window.deleteProduct =
async function deleteProduct(
  id
){

  if(
    !confirm(
      "Delete this product?"
    )
  ){
    return;
  }

  try{

    await fetch(
      `/api/products/${id}`,
      {
        method:"DELETE"
      }
    );

  }catch(err){

    console.warn(err);

  }

  products =
    products.filter(
      p => p.id !== id
    );

  renderProducts();

  showToast(
    "Product deleted"
  );

}

async function deleteProduct(
  id
){

  if(
    !confirm(
      "Delete this product?"
    )
  ){
    return;
  }

  try{

    await fetch(
      `/api/products/${id}`,
      {
        method:"DELETE"
      }
    );

  }catch(err){

    console.warn(err);

  }

  products =
    products.filter(
      p => p.id !== id
    );

  renderProducts();

  showToast(
    "Product deleted"
  );

}

function isLowStock(
  product
){

  return (
    product.stock <=
    (
      product.lowStockThreshold
      || 5
    )
  );

}

async function addProduct(){

  if(!selectedFile){

    showToast(
      "Select image",
      "error"
    );

    return;
  }

  setSaving(true);

  try{

    const serverProduct =
      await uploadToCloudinary(
        selectedFile,
        {
          title:title.value,
          price:price.value,
          category:category.value
        }
      );

    products.push(
      serverProduct
    );

    renderProducts();

    closeModal();

    showToast(
      "Product added"
    );

  }catch(err){

    showToast(
      err.message,
      "error"
    );

  }finally{

    setSaving(false);

  }

}

function setSaving(
  saving
){

  isSaving = saving;

  saveBtn.disabled =
    saving;

  saveBtn.innerHTML =
    saving
    ? `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Saving...
    `
    : "Save Product";
}


// =======================================
// LOAD PRODUCTS
// =======================================

async function loadProducts(){

  try{

    const response =
      await fetch(
        "/api/products"
      );

    if(!response.ok){

      throw new Error(
        "Failed to load products"
      );

    }

    products =
      await response.json();

    console.log(
      "Products loaded:",
      products.length
    );

    renderProducts();

  }catch(err){

    console.error(
      "Load products error:",
      err
    );

    showToast(
      "Failed to load products",
      "error"
    );

  }

}

document.addEventListener(
  "DOMContentLoaded",
  loadProducts
);