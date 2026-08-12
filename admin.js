// ==========================================
// SUPABASE CLIENT CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://mtdpidjcpopcnnoduemd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZHBpZGpjcG9wY25ub2R1ZW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDU0MDAsImV4cCI6MjA5OTQyMTQwMH0.0vrcMN-LuQV34iehWUgjiGWN7HH_ulBHSKlJ4mdtlec";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// NAVIGATION & UI INTERFACE
// ==========================================

// 🔄 Tab switcher (Creation vs Management)
function switchTab(tabName) {
    const tabCreation = document.getElementById('tabCreation');
    const tabManagement = document.getElementById('tabManagement');
    const btnCreation = document.getElementById('btnMenuCreation');
    const btnManagement = document.getElementById('btnMenuManagement');

    if (tabName === 'creation') {
        tabCreation.style.display = 'grid';
        tabManagement.style.display = 'none';
        btnCreation.classList.add('active');
        btnManagement.classList.remove('active');
    } else {
        tabCreation.style.display = 'none';
        tabManagement.style.display = 'block';
        btnManagement.classList.add('active');
        btnCreation.classList.remove('active');
        fetchAdminDocuments();
    }
}

// 🎥 Toggle between local video file and URL link
function toggleVideoInputType() {
    const type = document.getElementById('videoSourceType').value;
    const fileGroup = document.getElementById('videoFileInputGroup');
    const urlGroup = document.getElementById('videoUrlInputGroup');

    if (type === 'local') {
        fileGroup.style.display = 'flex';
        urlGroup.style.display = 'none';
    } else {
        fileGroup.style.display = 'none';
        urlGroup.style.display = 'flex';
    }
}

// 📄 Dynamically updates the display of the selected file
function updateFileInfo(inputId, statusId, prefix) {
    const fileInput = document.getElementById(inputId);
    const statusText = document.getElementById(statusId);
    
    if (fileInput.files.length > 0) {
        statusText.innerText = prefix + fileInput.files[0].name;
        statusText.style.color = "#10b981";
    }
}

// ==========================================
// ADMIN DASHBOARD ACTIONS
// ==========================================

// 1. 🚀 Publishing courses/documents (Table 'lecture_notes')
async function publishDocument() {
    const folderYear = document.getElementById('targetFolder').value;
    const docTitle = document.getElementById('docTitle').value.trim();
    
    if (!docTitle) {
        alert("Please enter a document title before publishing.");
        return;
    }

    const { data, error } = await supabaseClient
        .from('lecture_notes')
        .insert([
            { title: docTitle, folder_year: folderYear }
        ]);

    if (error) {
        alert("Supabase error: " + error.message);
        console.error(error);
    } else {
        alert(`Successfully published "${docTitle}" into the ${folderYear} Lecture Notes folder on Supabase!`);
        
        document.getElementById('docTitle').value = "";
        document.getElementById('docFile').value = "";
        document.getElementById('uploadStatus').innerText = "Click or drag your course document here";
        document.getElementById('uploadStatus').style.color = "#cbd5e1";
    }
}

// 2. 🚀 Publishing video lessons (Table 'videos')
async function publishVideo() {
    const videoTitle = document.getElementById('videoTitle').value.trim();
    const sourceType = document.getElementById('videoSourceType').value;
    let videoSource = "";

    if (!videoTitle) {
        alert("Please enter a video title.");
        return;
    }

    if (sourceType === 'local') {
        const videoFile = document.getElementById('videoFile').files[0];
        if (!videoFile) {
            alert("Please select a local video file to upload.");
            return;
        }
        videoSource = videoFile.name;
    } else {
        videoSource = document.getElementById('videoLink').value.trim();
        if (!videoSource) {
            alert("Please enter a valid video link.");
            return;
        }
    }

    const { data, error } = await supabaseClient
        .from('videos')
        .insert([
            { title: videoTitle, link: videoSource }
        ]);

    if (error) {
        alert("Supabase error: " + error.message);
        console.error(error);
    } else {
        alert(`Video lecture "${videoTitle}" successfully shared on Supabase!`);
        document.getElementById('videoTitle').value = "";
        document.getElementById('videoLink').value = "";
        document.getElementById('videoFile').value = "";
        document.getElementById('videoUploadStatus').innerText = "Click or drag your MP4/WebM video here";
        document.getElementById('videoUploadStatus').style.color = "#cbd5e1";
    }
}

// 3. 🚀 Deploying an exercise (Table 'exercises')
async function publishExercise() {
    const title = document.getElementById('exerciseTitle').value.trim();
    const instructions = document.getElementById('exerciseInstructions').value.trim();
    const fileInput = document.getElementById('exerciseFile');

    if (!title) {
        alert("Please enter an exercise title.");
        return;
    }

    if (!instructions) {
        alert("Please enter the exercise instructions.");
        return;
    }

    let fileUrl = fileInput.files.length > 0 ? fileInput.files[0].name : null;

    const { data, error } = await supabaseClient
        .from('exercises')
        .insert([
            { 
                title: title, 
                instructions: instructions,
                file_url: fileUrl,
                due_date: null
            }
        ]);

    if (error) {
        alert("Supabase error when adding exercise: " + error.message);
        console.error(error);
    } else {
        alert(`Exercise "${title}" successfully published in the exercises table!`);

        // Form reset
        document.getElementById('exerciseTitle').value = "";
        document.getElementById('exerciseInstructions').value = "";
        document.getElementById('exerciseFile').value = "";
        document.getElementById('exerciseUploadStatus').innerText = "Click or drag exercise PDF / instructions here";
        document.getElementById('exerciseUploadStatus').style.color = "#cbd5e1";
    }
}

// 4. 📩 Loading pending student tickets (Table 'questions')
async function fetchPendingTickets() {
    const ticketSelect = document.getElementById('questionTicket');
    if (!ticketSelect) return;

    const { data: tickets, error } = await supabaseClient
        .from('questions')
        .select('*')
        .eq('status', 'pending');

    if (error) {
        console.error("Error loading tickets :", error.message);
        return;
    }

    ticketSelect.innerHTML = '<option value="">Select a pending ticket...</option>';

    if (!tickets || tickets.length === 0) {
        ticketSelect.innerHTML = '<option value="">No questions pending 🎉</option>';
        return;
    }

    tickets.forEach(ticket => {
        const option = document.createElement('option');
        option.value = ticket.id;
        option.textContent = `#${ticket.id} (${ticket.student_name}) : ${ticket.question.substring(0, 45)}...`;
        ticketSelect.appendChild(option);
    });
}

// 5. 🚀 Answering a student ticket (Table 'questions')
async function answerQuestion() {
    const ticketSelect = document.getElementById('questionTicket');
    const answerText = document.getElementById('questionAnswer').value.trim();

    if (!ticketSelect.value) {
        alert("Please select a question ticket.");
        return;
    }
    if (!answerText) {
        alert("Please enter your answer.");
        return;
    }

    const ticketId = ticketSelect.value;

    const { error } = await supabaseClient
        .from('questions')
        .update({ 
            answer: answerText, 
            status: 'resolved',
            answered_at: new Date().toISOString()
        })
        .eq('id', ticketId);

    if (error) {
        alert("Supabase error when responding: " + error.message);
    } else {
        alert("Response sent and ticket marked as resolved!");
        document.getElementById('questionAnswer').value = "";
        fetchPendingTickets();
    }
}

// ==========================================
// REPOSITORY MANAGEMENT (MANAGEMENT TAB)
// ==========================================

// 📋 Load all documents in the CRUD table
async function fetchAdminDocuments() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94a3b8;">Fetching items from Supabase...</td></tr>`;

    const { data: documents, error } = await supabaseClient
        .from('lecture_notes')
        .select('*');

    if (error) {
        tbody.innerHTML = `<tr><td colspan="3" style="color: #f43f5e;">Error: ${error.message}</td></tr>`;
        return;
    }

    if (documents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b;">No documents found inside database.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    documents.forEach(doc => {
        const safeTitle = doc.title.replace(/'/g, "\\'");
        tbody.innerHTML += `
            <tr>
                <td><strong>${doc.title}</strong></td>
                <td><span style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px; color: #94a3b8;">${doc.folder_year}</span></td>
                <td>
                    <button class="action-icon-btn btn-edit" onclick="modifyDocumentTitle(${doc.id}, '${safeTitle}')" title="Edit Title">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-icon-btn btn-delete" onclick="removeDocument(${doc.id})" title="Delete File">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// ✏️ Modify document title
async function modifyDocumentTitle(id, oldTitle) {
    const updatedTitle = prompt("Update Document Title:", oldTitle);
    if (!updatedTitle || updatedTitle.trim() === "" || updatedTitle === oldTitle) return;

    const { error } = await supabaseClient
        .from('lecture_notes')
        .update({ title: updatedTitle.trim() })
        .eq('id', id);

    if (error) {
        alert("Failed to modify title: " + error.message);
    } else {
        fetchAdminDocuments();
    }
}

// ❌ Delete a document
async function removeDocument(id) {
    if (!confirm("Are you sure you want to permanently delete this file record from Supabase?")) return;

    const { error } = await supabaseClient
        .from('lecture_notes')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Failed to delete record: " + error.message);
    } else {
        fetchAdminDocuments();
    }
}

// 🚪 Function to exit the Dashboard (Redirection)
// 🚪 Exit dashboard and prevent backward navigation
function exitDashboard(event) {
    // 1. Prevent default link behavior
    event.preventDefault();

    // 2. Clear session storage (local/session)
    sessionStorage.clear();
    localStorage.clear();

    // 3. Replace current page in history to block the "Back" button
    window.location.replace("Login_page.html");
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchPendingTickets();
});