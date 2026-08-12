// 🚀 FUNCTION: Load PDF documents from Supabase (Table: lecture_notes)
async function fetchDocuments() {
    const { data: documents, error } = await supabaseClient
        .from('lecture_notes')
        .select('*');

    const list2026 = document.getElementById('list-2026');
    const list2027 = document.getElementById('list-2027');

    list2026.innerHTML = "";
    list2027.innerHTML = "";

    if (error || !documents) {
        list2026.innerHTML = '<li class="empty-status">No files available</li>';
        list2027.innerHTML = '<li class="empty-status">No files available</li>';
        return;
    }

    let count2026 = 0;
    let count2027 = 0;

    documents.forEach(doc => {
        const safeTitle = doc.title.replace(/'/g, "\\'");
        const fileUrl = doc.file_url || "#";

        const itemHTML = `
            <li class="file-item" onclick="openDocument('${safeTitle}', '${fileUrl}')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa-regular fa-file-pdf" style="color: #ef4444;"></i> 
                    <span>${doc.title}</span>
                </div>
                <a href="${fileUrl}" download="${doc.title}" class="download-icon-btn" onclick="event.stopPropagation();" title="Download">
                    <i class="fa-solid fa-download" style="color: #10b981;"></i>
                </a>
            </li>`;

        if (doc.folder_year === "2026") {
            list2026.innerHTML += itemHTML;
            count2026++;
        } else if (doc.folder_year === "2027") {
            list2027.innerHTML += itemHTML;
            count2027++;
        }
    });

    if (count2026 === 0) list2026.innerHTML = '<li class="empty-status">No files added by admin yet</li>';
    if (count2027 === 0) list2027.innerHTML = '<li class="empty-status">No files added by admin yet</li>';
}



// 🚀 FUNCTION: Load videos added by Admin (Table: videos)
async function fetchVideos() {

    const videoList = document.getElementById('video-list');

    const { data: videos, error } = await supabaseClient
        .from('videos')
        .select('*');

    videoList.innerHTML = "";

    if (error || !videos || videos.length === 0) {
        videoList.innerHTML =
            '<li class="empty-status">No videos added by admin yet</li>';
        return;
    }

    videos.forEach(vid => {

        const safeTitle = vid.title.replace(/'/g, "\\'");

        // Get the public video URL stored in the "link" column
        const videoUrl = vid.link;

        if (!videoUrl) {
            console.warn("No video URL found for:", vid.title);
            return;
        }

        const videoHTML = `
            <li class="file-item"
                onclick="openVideo('${safeTitle}', '${videoUrl}')">

                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa-circle-play fa-regular"
                       style="color: #ec4899;">
                    </i>

                    <span>${vid.title}</span>
                </div>

            </li>`;

        videoList.innerHTML += videoHTML;
    });
}


// 🚀 FUNCTION: Load the QUESTION AND ANSWER page
async function loadQAContent() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('qaNavBtn').classList.add('active');

    const workspace = document.getElementById('workspace');
    workspace.innerHTML = `
        <div class="about-section">
            <div class="about-header">
                <span><i class="fa-solid fa-comments" style="color: #6366f1;"></i> Class Forum</span>
                <span>Questions & Answers</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h1 style="font-size: 24px; margin-bottom: 4px;">Questions and Answers</h1>
                    <p style="color: #94a3b8; font-size: 14px;">Browse questions asked by students and teacher responses.</p>
                </div>
                <button class="btn-submit" style="display: flex; align-items: center; gap: 8px; margin-top: 0;" onclick="openTeacherModal()">
                    <i class="fa-solid fa-plus"></i> Ask the Teacher
                </button>
            </div>

            <div class="qa-container" id="qaListContainer">
                <p style="color: #64748b; font-style: italic;">Loading questions...</p>
            </div>
        </div>
    `;

    // Fetch questions from Supabase (Table: questions)
    const { data: questions, error } = await supabaseClient
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

    const qaListContainer = document.getElementById('qaListContainer');
    qaListContainer.innerHTML = "";

    if (error || !questions || questions.length === 0) {
        qaListContainer.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); padding: 30px; border-radius: 12px; text-align: center; color: #94a3b8;">
                <i class="fa-solid fa-circle-question" style="font-size: 32px; margin-bottom: 10px; color: #64748b;"></i>
                <p>No questions submitted yet. Be the first to ask!</p>
            </div>`;
        return;
    }

    questions.forEach(q => {
        const answerHTML = q.answer ? `
            <div class="qa-answer">
                <i class="fa-solid fa-reply-dall"></i>
                <div class="qa-answer-content">
                    <h5>Teacher's Answer</h5>
                    <p>${q.answer}</p>
                </div>
            </div>
        ` : `
            <p class="no-answer"><i class="fa-regular fa-clock"></i> Waiting for teacher's response...</p>
        `;

        qaListContainer.innerHTML += `
            <div class="qa-card">
                <div class="qa-question">
                    <i class="fa-solid fa-circle-question"></i>
                    <div>
                        <h4>${q.subject}</h4>
                        <p>${q.question}</p>
                    </div>
                </div>
                ${answerHTML}
            </div>
        `;
    });
}

// 🚀 FUNCTION: Submit a new question to Supabase
async function submitTeacherQuestion(e) {
    e.preventDefault();
    const subject = document.getElementById('questionSubject').value;
    const question = document.getElementById('questionBody').value;

    const { error } = await supabaseClient
        .from('questions')
        .insert([{ subject: subject, question: question }]);

    if (error) {
        alert("Error submitting question: " + error.message);
    } else {
        alert("Your question has been submitted successfully!");
        document.getElementById('questionSubject').value = '';
        document.getElementById('questionBody').value = '';
        closeTeacherModal();
        loadQAContent(); // Refresh UI
    }
}

// Function to load and display questions + teacher responses
async function loadLearningSpaceQA() {
  // Fetch questions with associated answers
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      title,
      content,
      created_at,
      answers (
        id,
        content,
        author_role,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Loading error:", error.message);
    return;
  }

  const qaContainer = document.getElementById('qa-container');
  qaContainer.innerHTML = '';

  questions.forEach(q => {
    // Generate question block
    let html = `
      <div class="qa-card" id="question-${q.id}">
        <h3>${q.title || 'Question'}</h3>
        <p>${q.content}</p>
        <div class="answers-section">
    `;

    // Inject teacher answer if available
    if (q.answers && q.answers.length > 0) {
      q.answers.forEach(ans => {
        html += `
          <div class="teacher-response">
            <strong>Teacher's Response:</strong>
            <p>${ans.content}</p>
          </div>
        `;
      });
    } else {
      html += `<p class="no-answer">Waiting for teacher's response...</p>`;
    }

    html += `
        </div>
      </div>
    `;

    qaContainer.insertAdjacentHTML('beforeend', html);
  });
}

// 🚀 FUNCTION: Load and display Exercises section (PDF)
async function loadExercisesContent() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('exercisesNavBtn').classList.add('active');

    const workspace = document.getElementById('workspace');
    workspace.innerHTML = `
        <div class="about-section">
            <div class="about-header">
                <span><i class="fa-solid fa-pen-to-square" style="color: #6366f1;"></i> Course Exercises</span>
                <span>PDF Worksheets</span>
            </div>
            <h1 style="font-size: 24px; margin-bottom: 8px;">Available Exercises</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">Download and complete your exercises uploaded by the teacher.</p>
            
            <div class="exercise-grid" id="exerciseContainer">
                <p style="color: #64748b; font-style: italic;">Loading exercises...</p>
            </div>
        </div>
    `;

    const { data: exercises, error } = await supabaseClient
        .from('exercises')
        .select('*');

    const exerciseContainer = document.getElementById('exerciseContainer');
    exerciseContainer.innerHTML = "";

    if (error || !exercises || exercises.length === 0) {
        exerciseContainer.innerHTML = `
            <div style="grid-column: 1/-1; background: rgba(255,255,255,0.02); padding: 30px; border-radius: 12px; text-align: center; color: #94a3b8;">
                <i class="fa-solid fa-folder-open" style="font-size: 30px; margin-bottom: 10px; color: #64748b;"></i>
                <p>No exercise PDFs added by admin yet.</p>
            </div>`;
        return;
    }

    exercises.forEach(ex => {
        const safeTitle = ex.title.replace(/'/g, "\\'");
        const fileUrl = ex.file_url || "#";
        const description = ex.description || "PDF exercise material provided by instructor.";

        exerciseContainer.innerHTML += `
            <div class="exercise-card">
                <div class="exercise-info">
                    <i class="fa-regular fa-file-pdf" style="font-size: 28px; color: #ef4444; margin-bottom: 10px;"></i>
                    <h4>${ex.title}</h4>
                    <p>${description}</p>
                </div>
                <div class="exercise-actions">
                    <button class="nav-btn" style="padding: 8px 12px; font-size: 12px;" onclick="openDocument('${safeTitle}', '${fileUrl}')">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                    <a href="${fileUrl}" download="${ex.title}" class="btn-download">
                        <i class="fa-solid fa-download"></i> Download
                    </a>
                </div>
            </div>
        `;
    });
}

// 🚀 FUNCTION: View a video in workspace
function openVideo(title, videoUrl) {
    console.log("Video title:", title);
    console.log("Video URL:", videoUrl);
    const workspace = document.getElementById('workspace');
    
    workspace.innerHTML = `
        <div class="about-section">
            <div class="about-header">
                <span><i class="fa-solid fa-video" style="color: #ec4899;"></i> Video Lecture</span>
                <span style="cursor:pointer;" onclick="location.reload()"><i class="fa-solid fa-xmark"></i> Close</span>
            </div>
            <h1 style="font-size: 24px; margin-bottom: 20px;">${title}</h1>
            <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; height: 420px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 15px; overflow: hidden;">
               ${videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? 
                 `<iframe src="${videoUrl.replace('watch?v=', 'embed/')}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>` : 
                    `<video controls playsinline style="width:100%; height:100%; max-height:420px;">
                         <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support HTML5 video.
                     </video>`
}
            </div>
        </div>
    `;
}

// 🚀 FUNCTION: View a PDF document
function openDocument(title, fileUrl) {
    const workspace = document.getElementById('workspace');
    workspace.innerHTML = `
        <div class="about-section">
            <div class="about-header">
                <span><i class="fa-regular fa-file-pdf" style="color: #ef4444;"></i> Document Viewer</span>
                <span style="cursor:pointer;" onclick="location.reload()"><i class="fa-solid fa-xmark"></i> Close</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px; margin: 0;">${title}</h1>
                
                <a href="${fileUrl}" download="${title}" class="nav-btn" style="background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); color: #ffffff; text-decoration: none;">
                    <i class="fa-solid fa-download"></i> Download PDF
                </a>
            </div>
            
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 20px; border-radius: 12px; min-height: 450px;">
                <iframe src="${fileUrl}" width="100%" height="500px" style="border: none; border-radius: 8px;"></iframe>
            </div>
        </div>
    `;
}

// 🔍 FUNCTION: Interactive search
function filterWorkspaceContent() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const fileItems = document.querySelectorAll('.file-item');

    fileItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = "flex";
            const parentList = item.closest('.file-list');
            if (parentList && query !== "") {
                parentList.classList.add('open');
                const header = parentList.previousElementSibling;
                if (header) header.classList.add('active');
            }
        } else {
            item.style.display = "none";
        }
    });
}

// 💬 FUNCTIONS: Ask Teacher Modal
function openTeacherModal() {
    document.getElementById('teacherModal').style.display = 'flex';
}

function closeTeacherModal() {
    document.getElementById('teacherModal').style.display = 'none';
}

// 📂 FUNCTION: Toggle folder open/close
function toggleFolder(headerElement, listId) {
    const targetList = document.getElementById(listId);
    targetList.classList.toggle('open');
    headerElement.classList.toggle('active');
}

function Logout(event) {
    // 1. Prevent default <a> tag navigation
    event.preventDefault();

    // 2. Clear session (local/session storage)
    sessionStorage.clear();
    localStorage.clear();

    // 3. Replace current page in history to block "Back" button
    window.location.replace("Login_page.html");
}

// Menu "Full project example"
function loadAboutContent() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('aboutBtn').classList.add('active');

    const workspace = document.getElementById('workspace');
    workspace.innerHTML = `
        <div class="about-section">
            <div class="about-header">
                <span>Course Introduction</span>
                <span>Software Engineering</span>
            </div>
            
            <p class="about-definition">
                Software Engineering is the systematic process of designing, developing, testing, and maintaining 
                software to create reliable, efficient, and high-quality applications.
            </p>
            
            <ul class="about-list">
                <li>It applies engineering principles, methods, and tools to develop software in a systematic manner.</li>
                <li>It supports teamwork, planning, documentation, testing, and maintenance to ensure successful software development throughout its lifecycle.</li>
                <li>It helps create software that meets user requirements while ensuring reliability, security, efficiency, and maintainability.</li>
            </ul>
            
            <div class="process-grid">
                <div class="process-card"><i class="fa-solid fa-calendar-check"></i><h4>Planning</h4></div>
                <div class="process-card"><i class="fa-solid fa-chart-pie"></i><h4>Analyze</h4></div>
                <div class="process-card"><i class="fa-solid fa-compass-drafting"></i><h4>Design</h4></div>
                <div class="process-card"><i class="fa-solid fa-laptop-code"></i><h4>Development</h4></div>
                <div class="process-card"><i class="fa-solid fa-layer-group"></i><h4>Implementation</h4></div>
                <div class="process-card"><i class="fa-solid fa-vial-virus"></i><h4>Testing</h4></div>
                <div class="process-card"><i class="fa-solid fa-circle-check"></i><h4>Validation</h4></div>
                <div class="process-card"><i class="fa-solid fa-screwdriver-wrench"></i><h4>Maintenance</h4></div>
            </div>
        </div>
    `;
}

// 🍔 FUNCTION: Handle opening/closing responsive sidebar (Hamburger menu)
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
});

// Initialization
fetchDocuments();
fetchVideos();