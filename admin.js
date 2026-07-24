// ==========================================
// CONFIGURATION SUPABASE CLIENT
// ==========================================
const SUPABASE_URL = "https://mtdpidjcpopcnnoduemd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZHBpZGpjcG9wY25ub2R1ZW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDU0MDAsImV4cCI6MjA5OTQyMTQwMH0.0vrcMN-LuQV34iehWUgjiGWN7HH_ulBHSKlJ4mdtlec";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// NAVIGATION & INTERFACE UI
// ==========================================

// 🔄 Commutateur d'onglets (Creation vs Management)
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

// 🎥 Basculer entre fichier vidéo local et lien URL
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

// 📄 Met à jour l'affichage dynamique du fichier sélectionné
function updateFileInfo(inputId, statusId, prefix) {
    const fileInput = document.getElementById(inputId);
    const statusText = document.getElementById(statusId);
    
    if (fileInput.files.length > 0) {
        statusText.innerText = prefix + fileInput.files[0].name;
        statusText.style.color = "#10b981";
    }
}

// ==========================================
// ACTIONS DU DASHBOARD ADMIN
// ==========================================

// 1. 🚀 Publication de cours/documents (Table 'lecture_notes')
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
        alert("Erreur Supabase : " + error.message);
        console.error(error);
    } else {
        alert(`Successfully published "${docTitle}" into the ${folderYear} Lecture Notes folder on Supabase!`);
        
        document.getElementById('docTitle').value = "";
        document.getElementById('docFile').value = "";
        document.getElementById('uploadStatus').innerText = "Click or drag your course document here";
        document.getElementById('uploadStatus').style.color = "#cbd5e1";
    }
}

// 2. 🚀 Publication de leçons vidéo (Table 'videos')
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
        alert("Erreur Supabase : " + error.message);
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

// 3. 🚀 Déploiement d'un exercice (Table 'exercises')
async function publishExercise() {
    const title = document.getElementById('exerciseTitle').value.trim();
    const instructions = document.getElementById('exerciseInstructions').value.trim();
    const fileInput = document.getElementById('exerciseFile');

    if (!title) {
        alert("Veuillez saisir un titre d'exercice.");
        return;
    }

    if (!instructions) {
        alert("Veuillez remplir les instructions de l'exercice.");
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
        alert("Erreur Supabase lors de l'ajout d'exercice : " + error.message);
        console.error(error);
    } else {
        alert(`Exercice "${title}" publié avec succès dans la table exercises !`);

        // Réinitialisation du formulaire
        document.getElementById('exerciseTitle').value = "";
        document.getElementById('exerciseInstructions').value = "";
        document.getElementById('exerciseFile').value = "";
        document.getElementById('exerciseUploadStatus').innerText = "Click or drag exercise PDF / instructions here";
        document.getElementById('exerciseUploadStatus').style.color = "#cbd5e1";
    }
}

// 4. 📩 Chargement des tickets d'étudiants en attente (Table 'questions')
async function fetchPendingTickets() {
    const ticketSelect = document.getElementById('questionTicket');
    if (!ticketSelect) return;

    const { data: tickets, error } = await supabaseClient
        .from('questions')
        .select('*')
        .eq('status', 'pending');

    if (error) {
        console.error("Erreur de chargement des tickets :", error.message);
        return;
    }

    ticketSelect.innerHTML = '<option value="">Sélectionner un ticket en attente...</option>';

    if (!tickets || tickets.length === 0) {
        ticketSelect.innerHTML = '<option value="">Aucune question en attente 🎉</option>';
        return;
    }

    tickets.forEach(ticket => {
        const option = document.createElement('option');
        option.value = ticket.id;
        option.textContent = `#${ticket.id} (${ticket.student_name}) : ${ticket.question.substring(0, 45)}...`;
        ticketSelect.appendChild(option);
    });
}

// 5. 🚀 Répondre à un ticket d'étudiant (Table 'questions')
async function answerQuestion() {
    const ticketSelect = document.getElementById('questionTicket');
    const answerText = document.getElementById('questionAnswer').value.trim();

    if (!ticketSelect.value) {
        alert("Veuillez sélectionner un ticket de question.");
        return;
    }
    if (!answerText) {
        alert("Veuillez saisir votre réponse.");
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
        alert("Erreur Supabase lors de la réponse : " + error.message);
    } else {
        alert("Réponse envoyée et ticket marqué comme résolu !");
        document.getElementById('questionAnswer').value = "";
        fetchPendingTickets();
    }
}

// ==========================================
// GESTION DU REPOSITORY (ONGLET MANAGEMENT)
// ==========================================

// 📋 Charger tous les documents dans la table CRUD
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

// ✏️ Modifier le titre d'un document
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

// ❌ Supprimer un document
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
// 🚪 Fonction pour sortir du Dashboard (Redirection)
function exitDashboard() {
    // Optionnel : Réinitialiser la session Supabase si vous utilisez l'authentification
    await supabaseClient.auth.signOut();

    // Optionnel : Nettoyer le stockage local si nécessaire
    localStorage.clear();
    sessionStorage.clear();

    // Redirige vers la page d'accueil ou de connexion
    window.location.href = "login.html"; // ou "/" ou "index.html"
}

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchPendingTickets();
});