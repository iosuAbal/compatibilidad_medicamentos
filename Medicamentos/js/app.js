// js/app.js

// Ruta al archivo CSV
const CSV_PATH = 'data/compatibilidad_medicamentos.csv'; 

let headers = [];
let matrix = {};

async function init() {
    try {
        const response = await fetch(CSV_PATH);
        if (!response.ok) throw new Error("No se pudo cargar el archivo CSV");
        
        const data = await response.text();
        parseCSV(data);
        populateDrug1();
        
        document.getElementById('drug1').addEventListener('change', handleDrug1Change);
        document.getElementById('drug2').addEventListener('change', showResult);

    } catch (error) {
        console.error(error);
        alert("Error: Recuerda usar Live Server para ver los cambios.");
    }
}

function parseCSV(csvText) {
    // Dividimos por líneas
    const lines = csvText.trim().split('\n');
    
    // --- 1. PROCESAR CABECERA ---
    // Limpiamos las comillas (") globales y dividimos por comas
    const headerRow = lines[0].replace(/"/g, '').split(',');
    
    // Tu archivo tiene: [0]Fila, [1]Medicamento, [2]Atropina, [3]Cefazolina...
    // Guardamos los headers empezando desde el índice 2
    headers = [];
    for(let k = 2; k < headerRow.length; k++) {
        headers.push(headerRow[k].trim());
    }

    // --- 2. PROCESAR FILAS ---
    for (let i = 1; i < lines.length; i++) {
        // Limpiamos comillas de toda la línea antes de dividir
        const cleanLine = lines[i].replace(/"/g, '');
        const row = cleanLine.split(',');
        
        // CORRECCIÓN CLAVE:
        // El nombre del medicamento está en la posición 1 (la 0 es el número de fila "1", "2"...)
        const rowDrug = row[1] ? row[1].trim() : null;
        
        if(!rowDrug) continue;

        matrix[rowDrug] = {};

        // Recorremos las columnas de datos
        // La columna 2 del CSV corresponde al primer header (índice 0 de nuestro array headers)
        for (let j = 2; j < row.length; j++) {
            const colDrugIndex = j - 2; 
            
            if (colDrugIndex < headers.length) {
                const colDrugName = headers[colDrugIndex];
                let code = row[j] ? row[j].trim() : "G";
                
                if(code === "") code = "G"; // Si está vacío, asumimos G
                
                matrix[rowDrug][colDrugName] = code;
            }
        }
    }
}

function populateDrug1() {
    const drug1Select = document.getElementById('drug1');
    drug1Select.innerHTML = '<option value="">-- Seleccionar --</option>';
    
    // Obtenemos las claves de la matriz (los nombres de las filas)
    // Ahora rowDrug debería ser "Atropina...", no "1"
    const drugs = Object.keys(matrix).sort();
    
    drugs.forEach(drug => {
        const option = document.createElement('option');
        option.value = drug;
        option.textContent = drug;
        drug1Select.appendChild(option);
    });
}

function handleDrug1Change() {
    const drug1 = document.getElementById('drug1').value;
    const drug2Select = document.getElementById('drug2');
    const resultBox = document.getElementById('result');
    
    drug2Select.innerHTML = '<option value="">-- Seleccionar --</option>';
    resultBox.style.display = 'none';

    if (!drug1) {
        drug2Select.disabled = true;
        return;
    }

    drug2Select.disabled = false;
    
    // Usamos headers para listar el segundo medicamento
    headers.sort().forEach(drug2 => {
        if (drug1 === drug2) return;

        // Recuperamos el código de la matriz
        let code = "G";
        if (matrix[drug1] && matrix[drug1][drug2]) {
            code = matrix[drug1][drug2];
        }

        const option = document.createElement('option');
        option.value = drug2;
        
        let suffix = "";
        let isDisabled = false;

        switch (code) {
            case 'V':
                suffix = ""; 
                break;
            case 'R':
                suffix = " 🔴 (Incompatible)";
                isDisabled = true;
                break;
            case 'A':
                suffix = " 🟠 (Contradictorio)";
                isDisabled = true;
                break;
            case 'G':
                suffix = " ⚪ (Falta Datos)";
                isDisabled = true;
                break;
        }

        option.textContent = drug2 + suffix;
        if (isDisabled) option.disabled = true;

        drug2Select.appendChild(option);
    });
}

function showResult() {
    const drug1 = document.getElementById('drug1').value;
    const drug2 = document.getElementById('drug2').value;
    const resultBox = document.getElementById('result');

    if (!drug1 || !drug2) return;

    let code = "G";
    if (matrix[drug1] && matrix[drug1][drug2]) {
        code = matrix[drug1][drug2];
    }

    let message = "";
    let cssClass = "";
    
    // Resetear clases
    resultBox.className = "result-box";

    switch (code) {
        case 'V':
            message = "COMPATIBLE: Se pueden administrar juntos en Y.";
            cssClass = "bg-v";
            break;
        case 'R':
            message = "INCOMPATIBLE: Riesgo de precipitado o reacción química.";
            cssClass = "bg-r";
            break;
        case 'A':
            message = "CONTRADICTORIO: La literatura presenta datos opuestos.";
            cssClass = "bg-a";
            break;
        case 'G':
            message = "FALTA DE DATOS: No hay información suficiente.";
            cssClass = "bg-g";
            break;
        default:
            message = "Estado desconocido.";
            cssClass = "bg-g";
    }

    resultBox.textContent = message;
    resultBox.classList.add(cssClass);
    resultBox.style.display = 'block';
}

window.onload = init;