function generateInputs() {
  const nInput = document.getElementById("nInput");
  const mInput =document.getElementById("mInput")
  
  if (!nInput || !mInput) return;
  
  const n = parseInt(nInput.value);
  const m = parseInt(mInput.value);

  
  if (!Number.isInteger(n) || !Number.isInteger(m) || n <= 0 || m <= 0) {
    document.getElementById("basisContainer").innerHTML = "";
    document.getElementById("imageContainer").innerHTML = "";
    return;
  }

  //updates container for the two grids
  updateVectorContainer("basisContainer", n, n, "b", "basis");
  updateVectorContainer("imageContainer", n, m, "T(b", "image");
}
  //handles the animations
  function updateVectorContainer(containerId, vectorCount, coordsPerVector, labelPrefix, inputClass) {
    const container = document.getElementById(containerId);
    const currentVectors = container.querySelectorAll('.vector');

    //remove vectors for fields (decreased on spinbar)
    if (currentVectors.length > vectorCount) {
      for (let i = currentVectors.length - 1; i >= vectorCount; i--) {
        const v = currentVectors[i];
        v.classList.remove('show');
        v.addEventListener('transitionend', () => v.remove(), { once: true }); 
      }
    }

    //add new vectors for fields (increased on spinbar)
    if (currentVectors.length < vectorCount) {
      for (let i = currentVectors.length; i < vectorCount; i++) {
        const vectorDiv = document.createElement("div");
        vectorDiv.className = "vector";

        const label = document.createElement("label");
        label.textContent = labelPrefix.includes("T") ? `${labelPrefix}${i + 1})` : `${labelPrefix}${i + 1}`;
        vectorDiv.appendChild(label);

        //vector placement
        for (let j = 0; j < coordsPerVector; j++) {
          const input = createAnimatedInput(inputClass);
          vectorDiv.appendChild(input);
        }

        container.appendChild(vectorDiv);

        //show animation
        requestAnimationFrame(() => {
          vectorDiv.classList.add('show');
        });
      }
    }

    container.querySelectorAll('.vector').forEach((v) => {
      const inputs = v.querySelectorAll('input');
      if (inputs.length < coordsPerVector) {
        //vector placement returns
        for (let k = inputs.length; k < coordsPerVector; k++) {
          v.appendChild(createAnimatedInput(inputClass))
        }
      } else if (inputs.length > coordsPerVector) {
        //vector placement 3: the reckoning
        for (let k = inputs.length - 1; k >= coordsPerVector; k--) {
          inputs[k].remove();
        }
      }
    });
  }

  function createAnimatedInput(className) {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.pattern = "-?[0-9]*";
    input.className = className;
    forceNumericInput(input);
    return input;
  }
  
function computeStandardMatrix() {
  const n = parseInt(document.getElementById("nInput").value);
  const m = parseInt(document.getElementById("mInput").value);
  const output = document.getElementById("output");
  const steps = document.getElementById("steps");

  output.innerHTML = "";
  steps.innerHTML = "";

  try {
    const basisInputs = document.querySelectorAll(".basis");
    const imageInputs = document.querySelectorAll(".image");

    let basis = [];
    let images = [];

    for (let i = 0; i < n; i++) {
      basis.push(
        Array.from(basisInputs)
          .slice(i * n, (i + 1) * n)
          .map(input => parseNumber(input.value))

      );

      images.push(
        Array.from(imageInputs)
          .slice(i * m, (i + 1) * m)
          .map(input => parseNumber(input.value))

      );
    }

    //  Final safety check (after parsing, before math)
    if (
    basis.flat().some(v => isNaN(v)) ||
    images.flat().some(v => isNaN(v))
    ) {
    throw new Error(
        "All inputs must be valid integers, decimals, or fractions."
    );
    }


    // B = [b1 b2 ... bn]
    const B = Array.from({ length: n }, (_, i) =>
      basis.map(v => v[i])
    );

    // C = [T(b1) T(b2) ... T(bn)]
    const C = Array.from({ length: m }, (_, i) =>
      images.map(v => v[i])
    );

    const B_inv = invertMatrix(B);
    const A = multiplyMatrices(C, B_inv);

    // Display final result
    output.innerHTML = `<h2>Standard Matrix A</h2>`;
    output.appendChild(renderMatrix(A));

    // Show solution steps
    steps.innerHTML = `
      <div class="step">
        <h3>Step 1: Basis Matrix B</h3>
      </div>
    `;
    steps.appendChild(renderMatrix(B));

    steps.innerHTML += `
      <div class="step">
        <h3>Step 2: Inverse of B (B⁻¹)</h3>
      </div>
    `;
    steps.appendChild(renderMatrix(B_inv));

    steps.innerHTML += `
      <div class="step">
        <h3>Step 3: Image Matrix C</h3>
      </div>
    `;
    steps.appendChild(renderMatrix(C));

    steps.innerHTML += `
      <div class="step">
        <h3>Step 4: Compute A = C · B⁻¹</h3>
      </div>
    `;
    steps.appendChild(renderMatrix(A));

  } catch (err) {
    output.textContent = "Error: " + err.message;
  }

  document.getElementById("steps").style.display = "none";

}


/* ---------- Matrix Utilities ---------- */

function multiplyMatrices(A, B) {
  return A.map(row =>
    B[0].map((_, j) =>
      row.reduce((sum, val, i) => sum + val * B[i][j], 0)
    )
  );
}

function invertMatrix(matrix) {
  const n = matrix.length;
  let I = matrix.map((row, i) =>
    row.map((_, j) => (i === j ? 1 : 0))
  );
  let M = matrix.map(row => row.slice());

  for (let i = 0; i < n; i++) {
    if (M[i][i] === 0) {
      throw new Error("Basis matrix is not invertible.");
    }

    let pivot = M[i][i];
    for (let j = 0; j < n; j++) {
      M[i][j] /= pivot;
      I[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        let factor = M[k][i];
        for (let j = 0; j < n; j++) {
          M[k][j] -= factor * M[i][j];
          I[k][j] -= factor * I[i][j];
        }
      }
    }
  }
  return I;
}

function renderMatrix(matrix) {
  const container = document.createElement("div");
  container.className = "matrix-display";

  matrix.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "matrix-row";

    row.forEach(value => {
      const cell = document.createElement("div");
      cell.className = "matrix-cell";
      cell.textContent = Number(value).toFixed(2);
      rowDiv.appendChild(cell);
    });

    container.appendChild(rowDiv);
  });

  return container;
}

// Button scripts

function toggleSteps() {
  const steps = document.getElementById("steps");
  steps.style.display =
    steps.style.display === "none" ? "block" : "none";
}

function resetInputs() {
  document.querySelectorAll(".basis, .image").forEach(input => {
    input.value = "";
  });

  document.getElementById("output").innerHTML = "";
  document.getElementById("steps").innerHTML = "";
}

function randomizeInputs() {
  const n = parseInt(document.getElementById("nInput").value);
  const m = parseInt(document.getElementById("mInput").value);

  // Start with identity matrix (guaranteed invertible)
  let B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  // Apply random row operations
  for (let k = 0; k < n * 2; k++) {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    if (i !== j) {
      const factor = Math.floor(Math.random() * 5) - 2;
      for (let c = 0; c < n; c++) {
        B[i][c] += factor * B[j][c];
      }
    }
  }

  // Fill basis inputs from columns of B
  const basisInputs = document.querySelectorAll(".basis");
  let index = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      basisInputs[index++].value = B[i][j];
    }
  }

  // Fill image inputs randomly (can be any numbers)
  document.querySelectorAll(".image").forEach(input => {
    input.value = (Math.floor(Math.random() * 11) - 5).toString();
  });

  document.getElementById("output").innerHTML = "";
  document.getElementById("steps").innerHTML = "";
}


// for numeric input
function forceNumericInput(input) {
  input.addEventListener("input", () => {
    let v = input.value;

    // Allow only digits, -, ., /
    v = v.replace(/[^0-9\-./]/g, "");

    // Allow only one minus, and only at the start
    if (v.includes("-")) {
      v = (v[0] === "-" ? "-" : "") + v.replace(/-/g, "");
    }

    // Allow only one decimal point
    const dotCount = (v.match(/\./g) || []).length;
    if (dotCount > 1) {
      const firstDot = v.indexOf(".");
      v =
        v.slice(0, firstDot + 1) +
        v.slice(firstDot + 1).replace(/\./g, "");
    }

    // Allow only one slash
    const slashCount = (v.match(/\//g) || []).length;
    if (slashCount > 1) {
      const firstSlash = v.indexOf("/");
      v =
        v.slice(0, firstSlash + 1) +
        v.slice(firstSlash + 1).replace(/\//g, "");
    }

    input.value = v;
  });
}

// for fraction inputs

function parseNumber(value) {
  if (value.includes("/")) {
    const [num, den] = value.split("/").map(Number);
    if (isNaN(num) || isNaN(den) || den === 0) return NaN;
    return num / den;
  }
  return Number(value);
}


/* Generate default layout */
const nInput = document.getElementById("nInput");
const mInput = document.getElementById("mInput");

nInput.addEventListener("input", generateInputs);
mInput.addEventListener("input", generateInputs);

generateInputs();
