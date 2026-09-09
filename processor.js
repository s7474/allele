// Global variable to store the processed result
window.ALLELE_PROCESSING_RESULT = null;

// Constants
const SAMPLE_ID = "SampleID";
const LOCUS = "Locus";
const ALLELE_1 = "FinalAssignmentAllele1";
const ALLELE_2 = "FinalAssignmentAllele2";

// Alleles enum mapping
const Alleles = {
    A: { name: "A", colName: "DA" },
    B: { name: "B", colName: "DB" },
    C: { name: "C", colName: "DC" },
    DRB1: { name: "DRB1", colName: "RB1" },
    DRB345: { name: "DRB345", colName: "RB" },
    DQA1: { name: "DQA1", colName: "QA1" },
    DQB1: { name: "DQB1", colName: "QB1" },
    DPA1: { name: "DPA1", colName: "PA1" },
    DPB1: { name: "DPB1", colName: "PB1" }
};

// Field length definitions (field name with padding)
const FieldLength = {
    ID: "ID          ",
    A1: "A1   ",
    A2: "A2   ",
    DA1: "DA1                  ",
    DA2: "DA2                  ",
    B1: "B1   ",
    B2: "B2   ",
    DB1: "DB1                  ",
    DB2: "DB2                  ",
    C1: "C1   ",
    C2: "C2   ",
    DC1: "DC1                  ",
    DC2: "DC2                  ",
    D1: "D1   ",
    D2: "D2   ",
    RB11: "RB11                 ",
    RB12: "RB12                 ",
    RB31: "RB31                 ",
    RB32: "RB32                 ",
    RB41: "RB41                 ",
    RB42: "RB42                 ",
    RB51: "RB51                 ",
    RB52: "RB52                 ",
    Q1: "Q1   ",
    Q2: "Q2   ",
    QB11: "QB11                 ",
    QB12: "QB12                 ",
    QA11: "QA11                 ",
    QA12: "QA12                 ",
    P1: "P1   ",
    P2: "P2   ",
    PA11: "PA11                 ",
    PA12: "PA12                 ",
    PB11: "PB11                 ",
    PB12: "PB12                 ",
    GND: "GND                  ",
    DOB: "DOB"
};

// FinalFile class
class FinalFile {
    constructor() {
        this.ID = null;
        this.A1 = null;
        this.A2 = null;
        this.DA1 = null;
        this.DA2 = null;
        this.B1 = null;
        this.B2 = null;
        this.DB1 = null;
        this.DB2 = null;
        this.C1 = null;
        this.C2 = null;
        this.DC1 = null;
        this.DC2 = null;
        this.D1 = null;
        this.D2 = null;
        this.RB11 = null;
        this.RB12 = null;
        this.RB31 = null;
        this.RB32 = null;
        this.RB41 = null;
        this.RB42 = null;
        this.RB51 = null;
        this.RB52 = null;
        this.Q1 = null;
        this.Q2 = null;
        this.QB11 = null;
        this.QB12 = null;
        this.QA11 = null;
        this.QA12 = null;
        this.P1 = null;
        this.P2 = null;
        this.PA11 = null;
        this.PA12 = null;
        this.PB11 = null;
        this.PB12 = null;
        this.GND = null;
        this.DOB = null;
    }

    setValue(fieldName, value) {
        fieldName = fieldName.replace(/\s+/g, ''); // Remove whitespace
        if (this.hasOwnProperty(fieldName)) {
            this[fieldName] = value;
        } else {
            throw new Error(`Field not found: ${fieldName} with value: ${value}`);
        }
    }

    compareTo(other) {
        return compareByIdAsc(this, other);
    }

    equals(other) {
        return this.ID === other.ID;
    }

    hashCode() {
        return this.ID;
    }
}

// Utility functions
function isNotBlank(str) {
    return str && str.trim().length > 0;
}

function compareByIdAsc(left, right) {
    if (!left || !right || !left.ID || !right.ID) return 0;
    // numeric:true keeps natural ordering for IDs like 2, 10, 100
    return left.ID.localeCompare(right.ID, undefined, { numeric: true, sensitivity: 'base' });
}

function rightPad(str, length) {
    str = str || "";
    while (str.length < length) {
        str += " ";
    }
    return str;
}

function parseCSV(text) {
    const lines = [];
    const rows = text.split(/\r?\n/);

    for (let row of rows) {
        if (!row.trim()) continue;

        const fields = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                fields.push(field);
                field = '';
            } else {
                field += char;
            }
        }
        fields.push(field);
        lines.push(fields);
    }

    return lines;
}

function extractHeaders(rows) {
    const headerToKey = {};
    const headers = rows[0];

    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].trim();
        if (header === SAMPLE_ID || header === LOCUS || header === ALLELE_1 || header === ALLELE_2) {
            headerToKey[header] = i;
        }
    }

    return headerToKey;
}

function processCSVFile(csvText, allIds) {
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
        throw new Error("CSV file is empty");
    }

    const headerToKey = extractHeaders(rows);
    const target = {};

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= 1) continue; // Skip empty rows

        const key = row[headerToKey[SAMPLE_ID]];
        if (!key || !key.trim()) continue;

        let finalFile = target[key];
        if (!finalFile) {
            finalFile = new FinalFile();
            target[key] = finalFile;
        }

        finalFile.setValue("ID", key);

        const locusValue = row[headerToKey[LOCUS]];
        if (!locusValue) continue;

        const allele = Alleles[locusValue];
        if (!allele) {
            log(`Unknown allele type: ${locusValue}`, 'error');
            continue;
        }

        if (allele.name === "DRB345") {
            // Special handling for DRB345
            if (isNotBlank(row[headerToKey[ALLELE_1]])) {
                const separatedFields = row[headerToKey[ALLELE_1]].split("*");
                if (separatedFields.length >= 2) {
                    finalFile.setValue(allele.colName + separatedFields[0] + "1", separatedFields[1]);
                }
            }
            if (isNotBlank(row[headerToKey[ALLELE_2]])) {
                const separatedFields = row[headerToKey[ALLELE_2]].split("*");
                if (separatedFields.length >= 2) {
                    finalFile.setValue(allele.colName + separatedFields[0] + "2", separatedFields[1]);
                }
            }
        } else {
            if (isNotBlank(row[headerToKey[ALLELE_1]])) {
                finalFile.setValue(allele.colName + "1", row[headerToKey[ALLELE_1]]);
            }
            if (isNotBlank(row[headerToKey[ALLELE_2]])) {
                finalFile.setValue(allele.colName + "2", row[headerToKey[ALLELE_2]]);
            }
        }
    }

    // Sort and add to allIds
    const values = Object.values(target).sort((a, b) => a.compareTo(b));
    log(`Processed ${values.length} records from file`, 'success');

    values.forEach(f => allIds.push(f));

    return values.length;
}

function generateOutput(allIds) {
    let result = "";

    // Add header
    for (let key in FieldLength) {
        result += FieldLength[key];
    }

    // Add each record
    for (let finalFile of allIds) {
        result += "\n";
        for (let key in FieldLength) {
            const fieldName = FieldLength[key].replace(/\s+/g, '');
            const value = finalFile[fieldName];
            result += rightPad(value || "", FieldLength[key].length);
        }
    }

    return result;
}

// UI Functions
function log(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Main processing function
async function processFiles(files) {
    log('Starting file processing...', 'info');
    document.getElementById('spinner').classList.add('active');
    document.getElementById('processBtn').disabled = true;

    try {
        const allIds = [];
        let filesProcessed = 0;

        for (let file of files) {
            log(`Processing file: ${file.name}`, 'info');

            const text = await file.text();
            try {
                processCSVFile(text, allIds);
                filesProcessed++;
            } catch (error) {
                log(`Error processing ${file.name}: ${error.message}`, 'error');
                console.error(error);
            }
        }

        log(`Processed ${filesProcessed} files`, 'success');
        log(`Total records: ${allIds.length}`, 'info');

        const uniqueIds = new Set(allIds.map(f => f.ID));
        log(`Unique records: ${uniqueIds.size}`, 'info');

        // Check for duplicates
        const duplicateMap = {};
        for (let f of allIds) {
            if (duplicateMap[f.ID]) {
                duplicateMap[f.ID]++;
            } else {
                duplicateMap[f.ID] = 1;
            }
        }

        const duplicates = Object.entries(duplicateMap).filter(([id, count]) => count > 1);
        if (duplicates.length > 0) {
            log(`Found ${duplicates.length} duplicate IDs`, 'error');
            duplicates.forEach(([id, count]) => {
                log(`  ${id}: ${count} occurrences`, 'error');
            });
        }

        // Ensure final output is globally sorted by ID across all processed files.
        allIds.sort(compareByIdAsc);

        // Generate output
        const output = generateOutput(allIds);

        // Store in global variable
        window.ALLELE_PROCESSING_RESULT = output;

        log('Processing complete!', 'success');
        log(`Result stored in window.ALLELE_PROCESSING_RESULT`, 'success');

        // Update UI
        document.getElementById('totalRecords').textContent = allIds.length;
        document.getElementById('uniqueRecords').textContent = uniqueIds.size;
        document.getElementById('filesProcessed').textContent = filesProcessed;

        // Show preview (first 50 lines)
        const lines = output.split('\n');
        const preview = lines.join('\n');
        document.getElementById('resultPreview').textContent = preview;

        document.getElementById('resultSection').classList.add('visible');

    } catch (error) {
        log(`Fatal error: ${error.message}`, 'error');
        console.error(error);
    } finally {
        document.getElementById('spinner').classList.remove('active');
        document.getElementById('processBtn').disabled = false;
    }
}

// Event handlers
let selectedFiles = [];

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Drag and drop
dropZone.addEventListener('click', () => {
    fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
    if (files.length > 0) {
        addFiles(files);
    } else {
        log('Please drop only CSV files', 'error');
    }
});

// File input
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
});

function addFiles(files) {
    selectedFiles = [...selectedFiles, ...files];
    updateFileList();
    processBtn.disabled = selectedFiles.length === 0;
    log(`Added ${files.length} file(s). Total: ${selectedFiles.length}`, 'info');
}

function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="btn" onclick="removeFile(${index})" style="padding: 5px 15px; font-size: 14px;">Remove</button>
        `;
        fileList.appendChild(item);
    });
}

window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    processBtn.disabled = selectedFiles.length === 0;
    log(`File removed. Remaining: ${selectedFiles.length}`, 'info');
};

// Process button
processBtn.addEventListener('click', () => {
    if (selectedFiles.length > 0) {
        processFiles(selectedFiles);
    }
});

// Clear button
clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    updateFileList();
    processBtn.disabled = true;
    document.getElementById('logContainer').innerHTML = '';
    document.getElementById('resultSection').classList.remove('visible');
    window.ALLELE_PROCESSING_RESULT = null;
    log('Cleared all files and results', 'info');
});

// Download CSV button
downloadBtn.addEventListener('click', () => {
    if (window.ALLELE_PROCESSING_RESULT) {
        try {
            // Create a Blob from the result data
            const blob = new Blob([window.ALLELE_PROCESSING_RESULT], { type: 'text/csv;charset=utf-8;' });

            // Create a temporary URL for the blob
            const url = URL.createObjectURL(blob);

            // Create a temporary anchor element to trigger the download
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            link.download = `allele_processing_result_${timestamp}.csv`;

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Release the URL object
            URL.revokeObjectURL(url);

            showNotification('CSV file downloaded!');
            log('Result downloaded as CSV file', 'success');
        } catch (error) {
            log('Failed to download CSV: ' + error.message, 'error');
            console.error(error);
        }
    }
});

// Initial log message
log('Ready to process CSV files. Drop or select files to begin.', 'info');

